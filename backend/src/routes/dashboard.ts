import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDashboardStats,
  getRecentTasks,
  getPendingApprovals
} from '../controllers/dashboardController';

const router = Router();

// All routes require authentication
router.get('/stats', authenticate, getDashboardStats);
router.get('/recent-tasks', authenticate, getRecentTasks);
router.get('/pending-approvals', authenticate, getPendingApprovals);

export default router;