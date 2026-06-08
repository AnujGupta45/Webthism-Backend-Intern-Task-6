import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { MailService } from '../services/mail.service';

export class AdminController {
  public static async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;

      const where: any = {};
      if (status) {
        where.status = status as string;
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: { select: { name: true, imageUrl: true } },
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

  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, email: true } },
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found.');
      }

      if (order.status === status) {
        throw new BadRequestError(`Order status is already ${status}.`);
      }

      const oldStatus = order.status;

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status },
      });

      // Send shipping/delivery notification email if status changes
      if (['SHIPPED', 'DELIVERED'].includes(status)) {
        await MailService.sendShippingUpdate(order.user.email, order.user.name, {
          id: order.id,
          status,
        });
      }

      res.status(200).json({
        status: 'success',
        message: `Order status updated from ${oldStatus} to ${status}.`,
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }
}
