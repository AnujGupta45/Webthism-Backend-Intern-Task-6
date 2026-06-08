import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', authenticate, authorize('ADMIN'), validateRequest(createProductSchema), ProductController.createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), validateRequest(updateProductSchema), ProductController.updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), ProductController.deleteProduct);

export default router;
