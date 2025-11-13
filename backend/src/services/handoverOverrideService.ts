import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateOverrideRequestParams {
  chequeId: string;
  requestedBy: string;
  reason: string;
}

interface ApproveOverrideParams {
  overrideId: string;
  approvedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

interface RejectOverrideParams {
  overrideId: string;
  rejectedBy: string;
  rejectedReason: string;
}

export class HandoverOverrideService {
  /**
   * Create override request
   */
  static async createOverrideRequest(params: CreateOverrideRequestParams) {
    const { chequeId, requestedBy, reason } = params;

    // Check if cheque exists
    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    // Check if there's already a pending override
    const existingOverride = await prisma.handoverOverride.findFirst({
      where: {
        chequeId,
        status: 'PENDING',
      },
    });

    if (existingOverride) {
      throw new Error('An override request is already pending for this cheque');
    }

    // Create override request
    const override = await prisma.handoverOverride.create({
      data: {
        chequeId,
        requestedBy,
        reason,
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        chequeId,
        action: 'OVERRIDE_REQUESTED',
        userId: requestedBy,
        details: JSON.stringify({
          overrideId: override.id,
          reason,
        }),
      },
    });

    // TODO: Send notification to HOD/Approvers
    console.log(`🔔 Override requested for cheque ${cheque.chequeNo} by user ${requestedBy}`);

    return override;
  }

  /**
   * Approve override request
   */
  static async approveOverride(params: ApproveOverrideParams) {
    const { overrideId, approvedBy, ipAddress, userAgent } = params;

    const override = await prisma.handoverOverride.findUnique({
      where: { id: overrideId },
      include: {
        requestedByUser: true,
      },
    });

    if (!override) {
      throw new Error('Override request not found');
    }

    if (override.status !== 'PENDING') {
      throw new Error(`Override request is already ${override.status}`);
    }

    // Update override status
    const updated = await prisma.handoverOverride.update({
      where: { id: overrideId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        chequeId: override.chequeId,
        action: 'OVERRIDE_APPROVED',
        userId: approvedBy,
        details: JSON.stringify({
          overrideId,
          requestedBy: override.requestedBy,
          reason: override.reason,
        }),
        ipAddress,
        userAgent,
      },
    });

    // TODO: Send notification to reception staff
    console.log(`✅ Override approved for override ${overrideId} by user ${approvedBy}`);

    return updated;
  }

  /**
   * Reject override request
   */
  static async rejectOverride(params: RejectOverrideParams) {
    const { overrideId, rejectedBy, rejectedReason } = params;

    const override = await prisma.handoverOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new Error('Override request not found');
    }

    if (override.status !== 'PENDING') {
      throw new Error(`Override request is already ${override.status}`);
    }

    // Update override status
    const updated = await prisma.handoverOverride.update({
      where: { id: overrideId },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        rejectedReason,
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        chequeId: override.chequeId,
        action: 'OVERRIDE_REJECTED',
        userId: rejectedBy,
        details: JSON.stringify({
          overrideId,
          requestedBy: override.requestedBy,
          reason: override.reason,
          rejectedReason,
        }),
      },
    });

    return updated;
  }

  /**
   * Get pending overrides (for HOD/Approvers)
   */
  static async getPendingOverrides(filters: {
    limit?: number;
    offset?: number;
  } = {}) {
    const { limit = 50, offset = 0 } = filters;

    const [overrides, total] = await Promise.all([
      prisma.handoverOverride.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          requestedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.handoverOverride.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    return {
      overrides,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get override by ID
   */
  static async getOverrideById(overrideId: string) {
    const override = await prisma.handoverOverride.findUnique({
      where: { id: overrideId },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!override) {
      throw new Error('Override request not found');
    }

    return override;
  }

  /**
   * Get overrides for a specific cheque
   */
  static async getOverridesByCheque(chequeId: string) {
    const overrides = await prisma.handoverOverride.findMany({
      where: { chequeId },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return overrides;
  }
}

