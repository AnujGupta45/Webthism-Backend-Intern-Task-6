import { Router } from 'express';
import authRouter from './auth.routes';
import categoryRouter from './category.routes';
import productRouter from './product.routes';
import cartRouter from './cart.routes';
import orderRouter from './order.routes';
import adminRouter from './admin.routes';
import paymentRouter from './payment.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/admin', adminRouter);
router.use('/payments', paymentRouter);

export default router;
