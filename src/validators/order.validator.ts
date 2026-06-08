import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.string().min(5, 'Shipping address must be at least 5 characters long'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
      errorMap: () => ({ message: 'Status must be one of: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED' }),
    }),
  }),
  params: z.object({
    id: z.string().uuid('Order ID must be a valid UUID'),
  }),
});
