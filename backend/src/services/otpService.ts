import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration from environment
const OTP_SECRET = process.env.OTP_SECRET || 'your-secret-key-change-in-production';
const OTP_EXPIRY_MINS = parseInt(process.env.OTP_EXPIRY_MINS || '10');
const MAX_OTP_ATTEMPTS = 3;
const MAX_OTPS_PER_DAY = 3;

interface GenerateOtpParams {
  chequeId: string;
  channel: 'sms' | 'whatsapp' | 'email';
  toContact: string;
  ipAddress?: string;
  userAgent?: string;
}

interface VerifyOtpParams {
  chequeId: string;
  otp: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class OtpService {
  /**
   * Hash OTP using HMAC-SHA256
   */
  private static hashOtp(otp: string): string {
    return crypto
      .createHmac('sha256', OTP_SECRET)
      .update(otp)
      .digest('hex');
  }

  /**
   * Generate secure random 6-digit OTP
   */
  private static generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Check rate limit for OTP generation
   */
  private static async checkRateLimit(chequeId: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const otpCount = await prisma.otp.count({
      where: {
        chequeId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    return otpCount < MAX_OTPS_PER_DAY;
  }

  /**
   * Get active OTP for cheque (not expired, not used, not locked)
   */
  private static async getActiveOtp(chequeId: string) {
    return await prisma.otp.findFirst({
      where: {
        chequeId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Generate and store OTP
   */
  static async generateOtp(params: GenerateOtpParams): Promise<{
    success: boolean;
    otpId?: string;
    otpCode?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    const { chequeId, channel, toContact, ipAddress, userAgent } = params;

    // Check rate limit
    const withinLimit = await this.checkRateLimit(chequeId);
    if (!withinLimit) {
      return {
        success: false,
        error: 'OTP generation rate limit exceeded. Maximum 3 OTPs per day.',
      };
    }

    // Check if there's an active OTP
    const existingOtp = await this.getActiveOtp(chequeId);
    if (existingOtp) {
      return {
        success: false,
        error: 'An active OTP already exists. Please wait for it to expire or use it.',
      };
    }

    // Generate OTP
    const otpCode = this.generateOtpCode();
    const otpHash = this.hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINS * 60 * 1000);

    // Store OTP
    const otp = await prisma.otp.create({
      data: {
        chequeId,
        otpHash,
        channel,
        toContact,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        chequeId,
        action: 'OTP_GENERATED',
        details: JSON.stringify({
          channel,
          toContact,
          otpId: otp.id,
        }),
        ipAddress,
        userAgent,
      },
    });

    // In development, log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 OTP for cheque ${chequeId}: ${otpCode} (expires in ${OTP_EXPIRY_MINS} mins)`);
    }

    return {
      success: true,
      otpId: otp.id,
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      expiresAt,
    };
  }

  /**
   * Verify OTP
   */
  static async verifyOtp(params: VerifyOtpParams): Promise<{
    success: boolean;
    error?: string;
    remainingAttempts?: number;
    locked?: boolean;
  }> {
    const { chequeId, otp, userId, ipAddress, userAgent } = params;

    // Get active OTP
    const otpRecord = await this.getActiveOtp(chequeId);

    if (!otpRecord) {
      return {
        success: false,
        error: 'No active OTP found or OTP has expired.',
      };
    }

    // Check if locked
    if (otpRecord.status === 'LOCKED') {
      return {
        success: false,
        error: 'OTP is locked due to too many failed attempts. Manual override required.',
        locked: true,
      };
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { status: 'EXPIRED' },
      });

      await prisma.auditLog.create({
        data: {
          chequeId,
          action: 'OTP_EXPIRED',
          userId,
          details: JSON.stringify({ otpId: otpRecord.id }),
          ipAddress,
          userAgent,
        },
      });

      return {
        success: false,
        error: 'OTP has expired.',
      };
    }

    // Verify OTP
    const inputOtpHash = this.hashOtp(otp);
    const isValid = inputOtpHash === otpRecord.otpHash;

    if (isValid) {
      // Mark OTP as used
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
          usedBy: userId,
          attempts: otpRecord.attempts + 1,
        },
      });

      // Log success
      await prisma.auditLog.create({
        data: {
          chequeId,
          action: 'OTP_VERIFIED',
          userId,
          details: JSON.stringify({ otpId: otpRecord.id }),
          ipAddress,
          userAgent,
        },
      });

      return {
        success: true,
      };
    } else {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      const shouldLock = newAttempts >= MAX_OTP_ATTEMPTS;

      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: {
          attempts: newAttempts,
          status: shouldLock ? 'LOCKED' : 'PENDING',
        },
      });

      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          chequeId,
          action: 'OTP_FAILED',
          userId,
          details: JSON.stringify({
            otpId: otpRecord.id,
            attempts: newAttempts,
            locked: shouldLock,
          }),
          ipAddress,
          userAgent,
        },
      });

      return {
        success: false,
        error: 'Invalid OTP.',
        remainingAttempts: Math.max(0, MAX_OTP_ATTEMPTS - newAttempts),
        locked: shouldLock,
      };
    }
  }

  /**
   * Send OTP via selected channel (pluggable adapter pattern)
   */
  static async sendOtp(
    channel: 'sms' | 'whatsapp' | 'email',
    toContact: string,
    otpCode: string,
    chequeNo: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Pluggable adapter pattern - implement actual sending logic here
      const message = `Your OTP for cheque ${chequeNo} handover is: ${otpCode}. Valid for ${OTP_EXPIRY_MINS} minutes.`;

      switch (channel) {
        case 'sms':
          // Implement SMS API integration (e.g., Twilio, AWS SNS)
          console.log(`📱 [SMS] Sending to ${toContact}: ${message}`);
          // await smsAdapter.send(toContact, message);
          break;

        case 'whatsapp':
          // Implement WhatsApp API integration
          console.log(`💬 [WhatsApp] Sending to ${toContact}: ${message}`);
          // await whatsappAdapter.send(toContact, message);
          break;

        case 'email':
          // Implement Email API integration
          console.log(`📧 [Email] Sending to ${toContact}: ${message}`);
          // await emailAdapter.send(toContact, 'Cheque Handover OTP', message);
          break;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
      };
    }
  }

  /**
   * Expire old OTPs (cleanup task)
   */
  static async expireOldOtps(): Promise<number> {
    const result = await prisma.otp.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }
}

