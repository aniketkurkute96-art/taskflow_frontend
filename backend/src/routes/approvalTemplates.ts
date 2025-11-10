import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../controllers/approvalTemplateController';

const router = Router();

// Admin only routes
router.get('/', authenticate, authorize(['admin']), getAllTemplates);
router.get('/:id', authenticate, authorize(['admin']), getTemplateById);
router.post('/', authenticate, authorize(['admin']), createTemplate);
router.put('/:id', authenticate, authorize(['admin']), updateTemplate);
router.delete('/:id', authenticate, authorize(['admin']), deleteTemplate);

export default router;