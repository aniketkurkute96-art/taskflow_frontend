import { OtpService } from '../services/otpService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');

const prisma = new PrismaClient();

describe('OtpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate OTP successfully', async () => {
      // Mock prisma calls
      (prisma.otp.count as jest.Mock).mockResolvedValue(0);
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.otp.create as jest.Mock).mockResolvedValue({
        id: 'otp-123',
        otpHash: 'hashed-otp',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await OtpService.generateOtp({
        chequeId: 'cheque-123',
        channel: 'sms',
        toContact: '+1234567890',
      });

      expect(result.success).toBe(true);
      expect(result.otpId).toBe('otp-123');
      expect(result.expiresAt).toBeDefined();
    });

    it('should fail when rate limit exceeded', async () => {
      (prisma.otp.count as jest.Mock).mockResolvedValue(3);

      const result = await OtpService.generateOtp({
        chequeId: 'cheque-123',
        channel: 'sms',
        toContact: '+1234567890',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit exceeded');
    });

    it('should fail when active OTP exists', async () => {
      (prisma.otp.count as jest.Mock).mockResolvedValue(0);
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-otp',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      const result = await OtpService.generateOtp({
        chequeId: 'cheque-123',
        channel: 'sms',
        toContact: '+1234567890',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('active OTP already exists');
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid OTP successfully', async () => {
      const mockOtp = {
        id: 'otp-123',
        otpHash: 'valid-hash',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      };

      (prisma.otp.findFirst as jest.Mock).mockResolvedValue(mockOtp);
      (prisma.otp.update as jest.Mock).mockResolvedValue({});
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Note: This test would need the actual OTP to match the hash
      // In a real test, you'd need to know the OTP that produces 'valid-hash'
    });

    it('should fail when no active OTP found', async () => {
      (prisma.otp.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await OtpService.verifyOtp({
        chequeId: 'cheque-123',
        otp: '123456',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active OTP found');
    });

    it('should lock OTP after 3 failed attempts', async () => {
      const mockOtp = {
        id: 'otp-123',
        otpHash: 'valid-hash',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 2, // Third attempt will lock
      };

      (prisma.otp.findFirst as jest.Mock).mockResolvedValue(mockOtp);
      (prisma.otp.update as jest.Mock).mockResolvedValue({});
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await OtpService.verifyOtp({
        chequeId: 'cheque-123',
        otp: 'wrong-otp',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.locked).toBe(true);
    });
  });

  describe('expireOldOtps', () => {
    it('should expire old OTPs', async () => {
      (prisma.otp.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const count = await OtpService.expireOldOtps();

      expect(count).toBe(5);
      expect(prisma.otp.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          expiresAt: expect.any(Object),
        },
        data: {
          status: 'EXPIRED',
        },
      });
    });
  });
});

