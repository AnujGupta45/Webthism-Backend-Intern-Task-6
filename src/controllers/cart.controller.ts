import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class CartController {
  public static async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              imageUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalAmount = cartItems.reduce(
        (total, item) => total + item.quantity * item.product.price,
        0
      );

      res.status(200).json({
        status: 'success',
        results: cartItems.length,
        totalAmount,
        data: { cart: cartItems },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addToCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId, quantity } = req.body;

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundError('Product not found.');
      }

      if (product.stock < quantity) {
        throw new BadRequestError(`Insufficient stock. Only ${product.stock} items left in stock.`);
      }

      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
      });

      let cartItem;

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + quantity;
        
        if (product.stock < newQuantity) {
          throw new BadRequestError(
            `Cannot add ${quantity} more items. You already have ${existingCartItem.quantity} in your cart, and maximum stock is ${product.stock}.`
          );
        }

        cartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: newQuantity },
          include: { product: true },
        });
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            userId,
            productId,
            quantity,
          },
          include: { product: true },
        });
      }

      res.status(200).json({
        status: 'success',
        data: { cartItem },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCartItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId } = req.params;
      const { quantity } = req.body;

      const cartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
        include: { product: true },
      });

      if (!cartItem) {
        throw new NotFoundError('Item not found in cart.');
      }

      if (cartItem.product.stock < quantity) {
        throw new BadRequestError(
          `Insufficient stock. Only ${cartItem.product.stock} items available.`
        );
      }

      const updatedCartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
        include: { product: true },
      });

      res.status(200).json({
        status: 'success',
        data: { cartItem: updatedCartItem },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async removeCartItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId } = req.params;

      const cartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
      });

      if (!cartItem) {
        throw new NotFoundError('Item not found in cart.');
      }

      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });

      res.status(200).json({
        status: 'success',
        message: 'Item removed from cart.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      res.status(200).json({
        status: 'success',
        message: 'Cart cleared successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
