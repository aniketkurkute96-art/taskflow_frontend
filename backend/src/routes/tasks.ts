import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/taskController';

const router = Router();

// All routes require authentication
router.get('/', authenticate, getUserTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, createTask);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

export default router;