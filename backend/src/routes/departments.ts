import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController';

const router = Router();

// Admin only routes
router.get('/', authenticate, authorize(['admin']), getAllDepartments);
router.get('/:id', authenticate, authorize(['admin']), getDepartmentById);
router.post('/', authenticate, authorize(['admin']), createDepartment);
router.put('/:id', authenticate, authorize(['admin']), updateDepartment);
router.delete('/:id', authenticate, authorize(['admin']), deleteDepartment);

export default router;