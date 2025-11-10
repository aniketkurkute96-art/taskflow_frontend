import { AppDataSource } from '../database';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { TaskApprover } from '../models/TaskApprover';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import { TaskStatus, UserRole } from '../types/enums';
import { ApproverStatus } from '../types/approval';

const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);
const taskApproverRepository = AppDataSource.getRepository(TaskApprover);

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    let taskStats: any = {};
    let approvalStats: any = {};

    if (user.role === UserRole.ADMIN) {
      // Admin gets system-wide stats
      taskStats = await getSystemTaskStats();
      approvalStats = await getSystemApprovalStats();
    } else {
      // Regular users get their personal stats
      taskStats = await getUserTaskStats(user.id);
      approvalStats = await getUserApprovalStats(user.id);
    }

    res.json({
      taskStats,
      approvalStats,
      userRole: user.role
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get task statistics for a user
async function getUserTaskStats(userId: string) {
  const [
    totalTasks,
    draftTasks,
    pendingApprovalTasks,
    approvedTasks,
    rejectedTasks,
    completedTasks
  ] = await Promise.all([
    taskRepository.count({ 
      where: [
        { creatorId: userId },
        { assigneeId: userId }
      ]
    }),
    taskRepository.count({ 
      where: [
        { creatorId: userId, status: TaskStatus.DRAFT },
        { assigneeId: userId, status: TaskStatus.DRAFT }
      ]
    }),
    taskRepository.count({ 
      where: [
        { creatorId: userId, status: TaskStatus.PENDING_APPROVAL },
        { assigneeId: userId, status: TaskStatus.PENDING_APPROVAL }
      ]
    }),
    taskRepository.count({ 
      where: [
        { creatorId: userId, status: TaskStatus.APPROVED },
        { assigneeId: userId, status: TaskStatus.APPROVED }
      ]
    }),
    taskRepository.count({ 
      where: [
        { creatorId: userId, status: TaskStatus.REJECTED },
        { assigneeId: userId, status: TaskStatus.REJECTED }
      ]
    }),
    taskRepository.count({ 
      where: [
        { creatorId: userId, status: TaskStatus.COMPLETED },
        { assigneeId: userId, status: TaskStatus.COMPLETED }
      ]
    })
  ]);

  return {
    total: totalTasks,
    draft: draftTasks,
    pendingApproval: pendingApprovalTasks,
    approved: approvedTasks,
    rejected: rejectedTasks,
    completed: completedTasks
  };
}

// Get approval statistics for a user
async function getUserApprovalStats(userId: string) {
  const [
    pendingApprovals,
    approvedApprovals,
    rejectedApprovals
  ] = await Promise.all([
    taskApproverRepository.count({ 
      where: { userId, status: ApproverStatus.PENDING }
    }),
    taskApproverRepository.count({ 
      where: { userId, status: ApproverStatus.APPROVED }
    }),
    taskApproverRepository.count({ 
      where: { userId, status: ApproverStatus.REJECTED }
    })
  ]);

  return {
    pending: pendingApprovals,
    approved: approvedApprovals,
    rejected: rejectedApprovals,
    total: pendingApprovals + approvedApprovals + rejectedApprovals
  };
}

// Get system-wide task statistics (Admin only)
async function getSystemTaskStats() {
  const [
    totalTasks,
    draftTasks,
    pendingApprovalTasks,
    approvedTasks,
    rejectedTasks,
    completedTasks
  ] = await Promise.all([
    taskRepository.count(),
    taskRepository.count({ where: { status: TaskStatus.DRAFT } }),
    taskRepository.count({ where: { status: TaskStatus.PENDING_APPROVAL } }),
    taskRepository.count({ where: { status: TaskStatus.APPROVED } }),
    taskRepository.count({ where: { status: TaskStatus.REJECTED } }),
    taskRepository.count({ where: { status: TaskStatus.COMPLETED } })
  ]);

  return {
    total: totalTasks,
    draft: draftTasks,
    pendingApproval: pendingApprovalTasks,
    approved: approvedTasks,
    rejected: rejectedTasks,
    completed: completedTasks
  };
}

// Get system-wide approval statistics (Admin only)
async function getSystemApprovalStats() {
  const [
    pendingApprovals,
    approvedApprovals,
    rejectedApprovals
  ] = await Promise.all([
    taskApproverRepository.count({ where: { status: ApproverStatus.PENDING } }),
    taskApproverRepository.count({ where: { status: ApproverStatus.APPROVED } }),
    taskApproverRepository.count({ where: { status: ApproverStatus.REJECTED } })
  ]);

  return {
    pending: pendingApprovals,
    approved: approvedApprovals,
    rejected: rejectedApprovals,
    total: pendingApprovals + approvedApprovals + rejectedApprovals
  };
}

// Get recent tasks
export const getRecentTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 10;
    
    let tasks: Task[];

    if (user.role === UserRole.ADMIN) {
      // Admin gets all recent tasks
      tasks = await taskRepository.find({
        relations: ['creator', 'assignee', 'department'],
        order: { createdAt: 'DESC' },
        take: limit
      });
    } else {
      // Regular users get their recent tasks
      tasks = await taskRepository.find({
        where: [
          { creatorId: user.id },
          { assigneeId: user.id }
        ],
        relations: ['creator', 'assignee', 'department'],
        order: { createdAt: 'DESC' },
        take: limit
      });
    }

    res.json({ tasks });
  } catch (error) {
    console.error('Get recent tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending approvals
export const getPendingApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (user.role === UserRole.ADMIN) {
      // Admin gets all pending approvals
      const pendingTasks = await taskRepository.find({
        where: { status: TaskStatus.PENDING_APPROVAL },
        relations: ['creator', 'assignee', 'department', 'approvers'],
        order: { createdAt: 'DESC' },
        take: limit
      });

      res.json({ pendingApprovals: pendingTasks });
    } else {
      // Regular users get their pending approvals
      const pendingApprovals = await taskApproverRepository.find({
        where: { 
          userId: user.id,
          status: ApproverStatus.PENDING
        },
        relations: ['task', 'task.creator', 'task.assignee', 'task.department'],
        order: { createdAt: 'DESC' },
        take: limit
      });

      const tasks = pendingApprovals.map(pa => pa.task);
      res.json({ pendingApprovals: tasks });
    }
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};