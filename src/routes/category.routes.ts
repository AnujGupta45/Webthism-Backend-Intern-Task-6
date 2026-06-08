import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createCategorySchema, updateCategorySchema } from '../validators/product.validator';

const router = Router();

router.get('/', CategoryController.getAllCategories);
router.post('/', authenticate, authorize('ADMIN'), validateRequest(createCategorySchema), CategoryController.createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), validateRequest(updateCategorySchema), CategoryController.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), CategoryController.deleteCategory);

export default router;
