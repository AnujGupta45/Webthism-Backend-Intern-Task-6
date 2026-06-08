import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { addToCartSchema, updateCartQuantitySchema } from '../validators/cart.validator';

const router = Router();

router.use(authenticate);

router.get('/', CartController.getCart);
router.post('/', validateRequest(addToCartSchema), CartController.addToCart);
router.put('/:productId', validateRequest(updateCartQuantitySchema), CartController.updateCartItem);
router.delete('/:productId', CartController.removeCartItem);
router.delete('/', CartController.clearCart);

export default router;
