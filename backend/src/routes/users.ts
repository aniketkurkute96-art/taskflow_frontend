import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile
} from '../controllers/userController';

const router = Router();

// Public routes
router.get('/profile', authenticate, getProfile);

// Admin only routes
router.get('/', authenticate, authorize(['admin']), getAllUsers);
router.get('/:id', authenticate, authorize(['admin']), getUserById);
router.post('/', authenticate, authorize(['admin']), createUser);
router.put('/:id', authenticate, authorize(['admin']), updateUser);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);

export default router;