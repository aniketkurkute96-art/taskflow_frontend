import express from 'express';
import { DocumentController } from '../controllers/documentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// Cheque Management Routes
// ============================================

/**
 * POST /api/documents/cheques
 * Create a new cheque
 * Roles: director, accounts
 */
router.post(
  '/cheques',
  requireRole(['director', 'accounts', 'admin']),
  DocumentController.createCheque
);

/**
 * GET /api/documents/cheques
 * List cheques with filters
 * Roles: all authenticated users
 */
router.get('/cheques', DocumentController.listCheques);

/**
 * GET /api/documents/cheques/:id
 * Get cheque details
 * Roles: all authenticated users
 */
router.get('/cheques/:id', DocumentController.getCheque);

/**
 * POST /api/documents/cheques/:id/mark-ready
 * Mark cheque as ready for dispatch
 * Roles: accounts
 */
router.post(
  '/cheques/:id/mark-ready',
  requireRole(['accounts', 'admin']),
  DocumentController.markReady
);

/**
 * POST /api/documents/cheques/:id/forward-to-reception
 * Forward cheque to reception
 * Roles: accounts
 */
router.post(
  '/cheques/:id/forward-to-reception',
  requireRole(['accounts', 'admin']),
  DocumentController.forwardToReception
);

/**
 * POST /api/documents/cheques/:id/generate-otp
 * Generate OTP for handover
 * Roles: reception
 */
router.post(
  '/cheques/:id/generate-otp',
  requireRole(['reception', 'admin']),
  DocumentController.generateOtp
);

/**
 * POST /api/documents/cheques/:id/verify-otp
 * Verify OTP and complete handover
 * Roles: reception
 */
router.post(
  '/cheques/:id/verify-otp',
  requireRole(['reception', 'admin']),
  DocumentController.verifyOtp
);

/**
 * POST /api/documents/cheques/:id/handover-override
 * Request manual handover override
 * Roles: reception
 */
router.post(
  '/cheques/:id/handover-override',
  requireRole(['reception', 'admin']),
  DocumentController.handoverOverride
);

/**
 * POST /api/documents/cheques/:id/cancel
 * Cancel a cheque
 * Roles: director, accounts, admin
 */
router.post(
  '/cheques/:id/cancel',
  requireRole(['director', 'accounts', 'admin']),
  DocumentController.cancelCheque
);

/**
 * GET /api/documents/cheques/:id/audit
 * Get audit trail for cheque
 * Roles: all authenticated users
 */
router.get('/cheques/:id/audit', DocumentController.getAuditTrail);

/**
 * GET /api/documents/cheques/:id/overrides
 * Get override history for a cheque
 * Roles: all authenticated users
 */
router.get('/cheques/:id/overrides', DocumentController.getChequeOverrides);

// ============================================
// Handover Override Routes
// ============================================

/**
 * GET /api/documents/handover-override/pending
 * Get pending override requests
 * Roles: hod, admin
 */
router.get(
  '/handover-override/pending',
  requireRole(['hod', 'admin']),
  DocumentController.getPendingOverrides
);

/**
 * POST /api/documents/handover-override/:overrideId/approve
 * Approve override request
 * Roles: hod, admin
 */
router.post(
  '/handover-override/:overrideId/approve',
  requireRole(['hod', 'admin']),
  DocumentController.approveOverride
);

/**
 * POST /api/documents/handover-override/:overrideId/reject
 * Reject override request
 * Roles: hod, admin
 */
router.post(
  '/handover-override/:overrideId/reject',
  requireRole(['hod', 'admin']),
  DocumentController.rejectOverride
);

export default router;

