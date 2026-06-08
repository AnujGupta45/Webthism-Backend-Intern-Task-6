import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { StripeService } from '../services/stripe.service';
import { MailService } from '../services/mail.service';
import { BadRequestError } from '../utils/errors';

export class PaymentController {
  public static async stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      res.status(400).json({ error: 'Missing stripe-signature header or webhook secret config.' });
      return;
    }

    let event;

    try {
      const rawBody = (req as any).rawBody;
      event = StripeService.verifyWebhookSignature(rawBody, sig as string, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const orderId = session.client_reference_id || session.metadata?.orderId;

        if (!orderId) {
          console.error('⚠️ Stripe Webhook: No orderId (client_reference_id) found in checkout session.');
          res.status(400).json({ error: 'No orderId associated with session.' });
          return;
        }

        console.log(`🔔 Stripe Webhook: Processing checkout completion for Order ${orderId}...`);

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { product: true } },
          },
        });

        if (!order) {
          console.error(`⚠️ Stripe Webhook: Order ${orderId} not found in database.`);
          res.status(404).json({ error: 'Order not found.' });
          return;
        }

        if (order.status !== 'PENDING') {
          console.log(`ℹ️ Stripe Webhook: Order ${orderId} has status ${order.status}. Skipping.`);
          res.status(200).json({ received: true, message: 'Already processed.' });
          return;
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product || product.stock < item.quantity) {
              throw new BadRequestError(`Insufficient stock for product ${product?.name || 'Unknown'}.`);
            }
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: product.stock - item.quantity },
            });
          }

          const finalOrder = await tx.order.update({
            where: { id: orderId },
            data: {
              status: 'PAID',
              paymentIntentId: session.payment_intent as string,
            },
            include: {
              items: { include: { product: true } },
            },
          });

          await tx.cartItem.deleteMany({
            where: { userId: order.userId },
          });

          return finalOrder;
        });

        const user = await prisma.user.findUnique({ where: { id: order.userId } });
        if (user) {
          await MailService.sendOrderConfirmation(user.email, user.name, {
            id: updatedOrder.id,
            totalAmount: updatedOrder.totalAmount,
            shippingAddress: updatedOrder.shippingAddress,
            items: updatedOrder.items.map((item) => ({
              product: { name: item.product.name },
              quantity: item.quantity,
              price: item.price,
            })),
          });
        }

        console.log(`✅ Stripe Webhook: Order ${orderId} successfully marked as PAID.`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error(`❌ Webhook processing error: ${error.message}`);
      res.status(500).json({ error: 'Webhook processing failed.' });
    }
  }
}
