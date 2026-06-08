import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createOrderSchema } from '../validators/order.validator';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createOrderSchema), OrderController.createOrder);
router.get('/', OrderController.getUserOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/:id/cancel', OrderController.cancelOrder);
router.post('/:id/pay-mock', OrderController.payMockOrder);

export default router;
