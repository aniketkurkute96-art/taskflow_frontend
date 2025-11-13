import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum ChequeStatus {
  SIGNED = 'SIGNED',
  READY_FOR_DISPATCH = 'READY_FOR_DISPATCH',
  WITH_RECEPTION = 'WITH_RECEPTION',
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
}

interface CreateChequeParams {
  chequeNo: string;
  amount: number;
  bank: string;
  branch: string;
  payerName: string;
  payeeName: string;
  dueDate: Date;
  initiatorId: string;
  attachments?: string[];
}

interface HandoverParams {
  chequeId: string;
  recipientName: string;
  idType: string;
  idNumber: string;
  recipientPhotoPath: string;
  signaturePath: string;
  handedBy: string;
  isOverride?: boolean;
  overrideApprovedBy?: string;
  overrideReason?: string;
}

export class ChequeService {
  /**
   * Create a new cheque
   */
  static async createCheque(params: CreateChequeParams) {
    const {
      chequeNo,
      amount,
      bank,
      branch,
      payerName,
      payeeName,
      dueDate,
      initiatorId,
      attachments,
    } = params;

    // Check if cheque number already exists
    const existing = await prisma.cheque.findUnique({
      where: { chequeNo },
    });

    if (existing) {
      throw new Error('Cheque number already exists');
    }

    const cheque = await prisma.cheque.create({
      data: {
        chequeNo,
        amount,
        bank,
        branch,
        payerName,
        payeeName,
        dueDate: new Date(dueDate),
        initiatorId,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: ChequeStatus.SIGNED,
      },
      include: {
        initiator: {
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
        chequeId: cheque.id,
        action: 'CHEQUE_CREATED',
        userId: initiatorId,
        details: JSON.stringify({
          chequeNo,
          amount,
          bank,
          payeeName,
        }),
      },
    });

    return cheque;
  }

  /**
   * Mark cheque as ready for dispatch
   */
  static async markReadyForDispatch(chequeId: string, userId: string) {
    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.status !== ChequeStatus.SIGNED) {
      throw new Error(
        `Invalid status transition. Current status: ${cheque.status}`
      );
    }

    const updated = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        status: ChequeStatus.READY_FOR_DISPATCH,
      },
      include: {
        initiator: true,
      },
    });

    // Log status change
    await prisma.auditLog.create({
      data: {
        chequeId,
        action: 'STATUS_CHANGED',
        userId,
        details: JSON.stringify({
          from: ChequeStatus.SIGNED,
          to: ChequeStatus.READY_FOR_DISPATCH,
        }),
      },
    });

    return updated;
  }

  /**
   * Forward cheque to reception
   */
  static async forwardToReception(
    chequeId: string,
    userId: string,
    notes?: string
  ) {
    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.status !== ChequeStatus.READY_FOR_DISPATCH) {
      throw new Error(
        `Invalid status transition. Current status: ${cheque.status}`
      );
    }

    // Update status
    const updated = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        status: ChequeStatus.WITH_RECEPTION,
      },
    });

    // Create custody log
    await prisma.custodyLog.create({
      data: {
        chequeId,
        fromRole: 'ACCOUNTS',
        toRole: 'RECEPTION',
        notes,
        createdBy: userId,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        chequeId,
        action: 'FORWARDED_TO_RECEPTION',
        userId,
        details: JSON.stringify({
          from: ChequeStatus.READY_FOR_DISPATCH,
          to: ChequeStatus.WITH_RECEPTION,
          notes,
        }),
      },
    });

    return updated;
  }

  /**
   * Complete handover after OTP verification
   */
  static async completeHandover(params: HandoverParams) {
    const {
      chequeId,
      recipientName,
      idType,
      idNumber,
      recipientPhotoPath,
      signaturePath,
      handedBy,
      isOverride = false,
      overrideApprovedBy,
      overrideReason,
    } = params;

    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.status !== ChequeStatus.WITH_RECEPTION) {
      throw new Error(
        `Invalid status. Cheque must be WITH_RECEPTION. Current: ${cheque.status}`
      );
    }

    // Create handover record
    const handoverRecord = await prisma.handoverRecord.create({
      data: {
        chequeId,
        recipientName,
        idType,
        idNumber,
        recipientPhotoPath,
        signaturePath,
        handedBy,
        isOverride,
        overrideApprovedBy,
        overrideReason,
      },
      include: {
        handedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update cheque status
    const updated = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        status: ChequeStatus.ISSUED,
      },
      include: {
        initiator: true,
        handoverRecords: {
          include: {
            handedByUser: true,
          },
        },
      },
    });

    // Create custody log
    await prisma.custodyLog.create({
      data: {
        chequeId,
        fromRole: 'RECEPTION',
        toRole: 'VENDOR',
        notes: `Handed to ${recipientName} (${idType}: ${idNumber})`,
        createdBy: handedBy,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        chequeId,
        action: 'HANDOVER_COMPLETED',
        userId: handedBy,
        details: JSON.stringify({
          recipientName,
          idType,
          idNumber,
          isOverride,
          handoverRecordId: handoverRecord.id,
        }),
      },
    });

    return {
      cheque: updated,
      handoverRecord,
    };
  }

  /**
   * Cancel cheque
   */
  static async cancelCheque(
    chequeId: string,
    userId: string,
    reason: string
  ) {
    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.status === ChequeStatus.ISSUED) {
      throw new Error('Cannot cancel an already issued cheque');
    }

    const previousStatus = cheque.status;

    const updated = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        status: ChequeStatus.CANCELLED,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        chequeId,
        action: 'CHEQUE_CANCELLED',
        userId,
        details: JSON.stringify({
          previousStatus,
          reason,
        }),
      },
    });

    return updated;
  }

  /**
   * Get cheque by ID with full details
   */
  static async getChequeById(chequeId: string) {
    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        custodyLogs: {
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        handoverRecords: {
          include: {
            handedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        auditLogs: {
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    return cheque;
  }

  /**
   * List cheques with filters
   */
  static async listCheques(filters: {
    status?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    search?: string;
    role?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      status,
      dueDateFrom,
      dueDateTo,
      search,
      role,
      userId,
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    if (search) {
      where.OR = [
        { chequeNo: { contains: search } },
        { payeeName: { contains: search } },
        { payerName: { contains: search } },
        { bank: { contains: search } },
      ];
    }

    // Role-based filtering
    if (role === 'reception') {
      where.status = ChequeStatus.WITH_RECEPTION;
    } else if (role === 'accounts') {
      where.status = {
        in: [ChequeStatus.SIGNED, ChequeStatus.READY_FOR_DISPATCH],
      };
    } else if (role === 'director' && userId) {
      where.initiatorId = userId;
    }

    const [cheques, total] = await Promise.all([
      prisma.cheque.findMany({
        where,
        include: {
          initiator: {
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
      prisma.cheque.count({ where }),
    ]);

    return {
      cheques,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get audit trail for a cheque
   */
  static async getAuditTrail(chequeId: string) {
    const auditLogs = await prisma.auditLog.findMany({
      where: { chequeId },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return auditLogs;
  }
}

