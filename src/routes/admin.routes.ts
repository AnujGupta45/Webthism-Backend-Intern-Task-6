import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { updateOrderStatusSchema } from '../validators/order.validator';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/orders', AdminController.getAllOrders);
router.put('/orders/:id/status', validateRequest(updateOrderStatusSchema), AdminController.updateOrderStatus);

export default router;
