import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

router.post('/webhook', PaymentController.stripeWebhook);

export default router;
