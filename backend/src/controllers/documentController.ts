import { Request, Response } from 'express';
import { ChequeService } from '../services/chequeService';
import { OtpService } from '../services/otpService';
import { HandoverOverrideService } from '../services/handoverOverrideService';

/**
 * Document Controller - Cheque Management
 */
export class DocumentController {
  /**
   * POST /api/documents/cheques
   * Create a new cheque
   */
  static async createCheque(req: Request, res: Response) {
    try {
      const {
        chequeNo,
        amount,
        bank,
        branch,
        payerName,
        payeeName,
        dueDate,
        attachments,
      } = req.body;

      // Validation
      if (!chequeNo || !amount || !bank || !branch || !payerName || !payeeName || !dueDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const cheque = await ChequeService.createCheque({
        chequeNo,
        amount: parseFloat(amount),
        bank,
        branch,
        payerName,
        payeeName,
        dueDate: new Date(dueDate),
        initiatorId: user.id,
        attachments,
      });

      res.status(201).json({
        success: true,
        data: cheque,
      });
    } catch (error: any) {
      console.error('Error creating cheque:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create cheque',
      });
    }
  }

  /**
   * POST /api/documents/cheques/:id/mark-ready
   * Mark cheque as ready for dispatch
   */
  static async markReady(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const cheque = await ChequeService.markReadyForDispatch(id, user.id);

      res.json({
        success: true,
        data: cheque,
      });
    } catch (error: any) {
      console.error('Error marking cheque ready:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark cheque ready',
      });
    }
  }

  /**
   * POST /api/documents/cheques/:id/forward-to-reception
   * Forward cheque to reception
   */
  static async forwardToReception(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const cheque = await ChequeService.forwardToReception(id, user.id, notes);

      res.json({
        success: true,
        data: cheque,
      });
    } catch (error: any) {
      console.error('Error forwarding cheque:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to forward cheque',
      });
    }
  }

  /**
   * POST /api/documents/cheques/:id/generate-otp
   * Generate OTP for cheque handover
   */
  static async generateOtp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { channel, toContact } = req.body;

      if (!channel || !toContact) {
        return res.status(400).json({
          success: false,
          error: 'Channel and contact are required',
        });
      }

      if (!['sms', 'whatsapp', 'email'].includes(channel)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid channel. Must be: sms, whatsapp, or email',
        });
      }

      // Get cheque details
      const cheque = await ChequeService.getChequeById(id);

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await OtpService.generateOtp({
        chequeId: id,
        channel,
        toContact,
        ipAddress,
        userAgent,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Send OTP via selected channel
      if (result.otpCode) {
        await OtpService.sendOtp(channel, toContact, result.otpCode, cheque.chequeNo);
      }

      // Don't return OTP in production
      const response: any = {
        success: true,
        message: 'OTP generated and sent successfully',
        otpId: result.otpId,
        expiresAt: result.expiresAt,
      };

      // Only include OTP in development mode
      if (process.env.NODE_ENV === 'development' && result.otpCode) {
        response.otpCode = result.otpCode;
      }

      res.json(response);
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate OTP',
      });
    }
  }

  /**
   * POST /api/documents/cheques/:id/verify-otp
   * Verify OTP and complete handover
   */
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        otp,
        recipientName,
        idType,
        idNumber,
        recipientPhotoPath,
        signaturePath,
      } = req.body;

      // Validation
      if (!otp || !recipientName || !idType || !idNumber || !recipientPhotoPath || !signaturePath) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Verify OTP
      const otpResult = await OtpService.verifyOtp({
        chequeId: id,
        otp,
        userId: user.id,
        ipAddress,
        userAgent,
      });

      if (!otpResult.success) {
        return res.status(400).json(otpResult);
      }

      // Complete handover
      const result = await ChequeService.completeHandover({
        chequeId: id,
        recipientName,
        idType,
        idNumber,
        recipientPhotoPath,
        signaturePath,
        handedBy: user.id,
      });

      res.json({
        success: true,
        message: 'Cheque handed over successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify OTP',
      });
    }
  }

  /**
   * POST /api/documents/cheques/:id/handover-override
   * Request manual handover override
   */
  static async handoverOverride(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Reason is required for override request',
        });
      }

      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const override = await HandoverOverrideService.createOverrideRequest({
        chequeId: id,
        requestedBy: user.id,
        reason,
      });

      res.status(201).json({
        success: true,
        message: 'Override request created successfully',
        data: override,
      });
    } catch (error: any) {
      console.error('Error creating override:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create override request',
      });
    }
  }

  /**
   * POST /api/documents/handover-override/:overrideId/approve
   * Approve handover override (HOD only)
   */
  static async approveOverride(req: Request, res: Response) {
    try {
      const { overrideId } = req.params;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const override = await HandoverOverrideService.approveOverride({
        overrideId,
        approvedBy: user.id,
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        message: 'Override approved successfully',
        data: override,
      });
    } catch (error: any) {
      console.error('Error approving override:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve override',
      });
    }
  }

  /**
   * POST /api/documents/handover-override/:overrideId/reject
   * Reject handover override (HOD only)
   */
  static async rejectOverride(req: Request, res: Response) {
    try {
      const { overrideId } = req.params;
      const { rejectedReason } = req.body;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!rejectedReason) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required',
        });
      }

      const override = await HandoverOverrideService.rejectOverride({
        overrideId,
        rejectedBy: user.id,
        rejectedReason,
      });

      res.json({
        success: true,
        message: 'Override rejected',
        data: override,
      });
    } catch (error: any) {
      console.error('Error rejecting override:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to reject override',
      });
    }
  }

  /**
   * GET /api/documents/cheques
   * List cheques with filters
   */
  static async listCheques(req: Request, res: Response) {
    try {
      const {
        status,
        dueDateFrom,
        dueDateTo,
        search,
        limit,
        offset,
      } = req.query;

      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await ChequeService.listCheques({
        status: status as string,
        dueDateFrom: dueDateFrom ? new Date(dueDateFrom as string) : undefined,
        dueDateTo: dueDateTo ? new Date(dueDateTo as string) : undefined,
        search: search as string,
        role: user.role,
        userId: user.id,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error listing cheques:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list cheques',
      });
    }
  }

  /**
   * GET /api/documents/cheques/:id
   * Get cheque details
   */
  static async getCheque(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const cheque = await ChequeService.getChequeById(id);

      res.json({
        success: true,
        data: cheque,
      });
    } catch (error: any) {
      console.error('Error getting cheque:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get cheque',
      });
    }
  }

  /**
   * GET /api/documents/cheques/:id/audit
   * Get audit trail for cheque
   */
  static async getAuditTrail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const auditLogs = await ChequeService.getAuditTrail(id);

      res.json({
        success: true,
        data: auditLogs,
      });
    } catch (error: any) {
      console.error('Error getting audit trail:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get audit trail',
      });
    }
  }

  /**
   * POST /api/documents/cheques/:id/cancel
   * Cancel a cheque
   */
  static async cancelCheque(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Cancellation reason is required',
        });
      }

      const cheque = await ChequeService.cancelCheque(id, user.id, reason);

      res.json({
        success: true,
        message: 'Cheque cancelled successfully',
        data: cheque,
      });
    } catch (error: any) {
      console.error('Error cancelling cheque:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel cheque',
      });
    }
  }

  /**
   * GET /api/documents/handover-override/pending
   * Get pending override requests (for HOD)
   */
  static async getPendingOverrides(req: Request, res: Response) {
    try {
      const { limit, offset } = req.query;

      const result = await HandoverOverrideService.getPendingOverrides({
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting pending overrides:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get pending overrides',
      });
    }
  }

  /**
   * GET /api/documents/cheques/:id/overrides
   * Get override history for a cheque
   */
  static async getChequeOverrides(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const overrides = await HandoverOverrideService.getOverridesByCheque(id);

      res.json({
        success: true,
        data: overrides,
      });
    } catch (error: any) {
      console.error('Error getting cheque overrides:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get override history',
      });
    }
  }
}

