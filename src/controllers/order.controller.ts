import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { StripeService } from '../services/stripe.service';
import { MailService } from '../services/mail.service';

export class OrderController {
  public static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { shippingAddress } = req.body;

      // 1. Get user cart items
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new BadRequestError('Your cart is empty. Add products before placing an order.');
      }

      // 2. Validate stock and calculate total
      let totalAmount = 0;
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for "${item.product.name}". Only ${item.product.stock} items left, but you requested ${item.quantity}.`
          );
        }
        totalAmount += item.quantity * item.product.price;
      }

      // 3. Create order in PENDING state (using a transaction to be safe)
      const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            userId,
            totalAmount,
            shippingAddress,
            status: 'PENDING',
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price, // snapshot price
              })),
            },
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        });
        return newOrder;
      });

      // 4. Create Stripe Checkout Session
      const sessionItems = order.items.map((item) => ({
        product: {
          name: item.product.name,
          description: item.product.description,
          imageUrl: item.product.imageUrl,
        },
        quantity: item.quantity,
        price: item.price,
      }));

      const session = await StripeService.createCheckoutSession(
        order.id,
        totalAmount,
        sessionItems,
        req.user!.email
      );

      // Save Stripe session details
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: session.id,
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Order created successfully.',
        data: {
          order: updatedOrder,
          checkoutUrl: session.url,
          stripeSessionId: session.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, imageUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        results: orders.length,
        data: { orders },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, imageUrl: true },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found.');
      }

      // Check if order belongs to user or user is Admin
      if (order.userId !== userId && userRole !== 'ADMIN') {
        throw new UnauthorizedError('You are not authorized to view this order.');
      }

      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async cancelOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundError('Order not found.');
      }

      if (order.userId !== userId) {
        throw new UnauthorizedError('You are not authorized to cancel this order.');
      }

      if (order.status !== 'PENDING') {
        throw new BadRequestError(`Cannot cancel order. Only PENDING orders can be cancelled. Current status is ${order.status}.`);
      }

      const cancelledOrder = await prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Order cancelled successfully.',
        data: { order: cancelledOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper endpoint to simulate successful payment and trigger webhooks logic
   * Useful when STRIPE_SECRET_KEY is not configured
   */
  public static async payMockOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // 1. Fetch order
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found.');
      }

      if (order.userId !== userId && req.user!.role !== 'ADMIN') {
        throw new UnauthorizedError('You are not authorized to process payment for this order.');
      }

      if (order.status !== 'PENDING') {
        throw new BadRequestError(`Only PENDING orders can be paid. Current status is ${order.status}.`);
      }

      // 2. Run payment confirmation transaction (checks stock, deducts stock, updates status, clears cart)
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Verify product stocks again
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundError(`Product "${item.product.name}" no longer exists.`);
          }

          if (product.stock < item.quantity) {
            throw new BadRequestError(
              `Insufficient stock for "${product.name}". Only ${product.stock} items left in stock, but order needs ${item.quantity}.`
            );
          }

          // Deduct stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: product.stock - item.quantity },
          });
        }

        // Update status to PAID
        const finalOrder = await tx.order.update({
          where: { id },
          data: { status: 'PAID' },
          include: {
            items: {
              include: { product: true },
            },
          },
        });

        // Clear cart for the order's user
        await tx.cartItem.deleteMany({
          where: { userId: order.userId },
        });

        return finalOrder;
      });

      // 3. Send email notification asynchronously
      // Fetch user email and name
      const userRecord = await prisma.user.findUnique({
        where: { id: order.userId },
      });

      if (userRecord) {
        await MailService.sendOrderConfirmation(
          userRecord.email,
          userRecord.name,
          {
            id: updatedOrder.id,
            totalAmount: updatedOrder.totalAmount,
            shippingAddress: updatedOrder.shippingAddress,
            items: updatedOrder.items.map((item) => ({
              product: { name: item.product.name },
              quantity: item.quantity,
              price: item.price,
            })),
          }
        );
      }

      res.status(200).json({
        status: 'success',
        message: 'Mock payment processed successfully. Cart cleared, stock deducted, and confirmation email sent.',
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }
}
