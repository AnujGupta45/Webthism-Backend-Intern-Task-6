import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Product ID must be a valid UUID'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
  }),
});

export const updateCartQuantitySchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be at least 1'),
  }),
  params: z.object({
    productId: z.string().uuid('Product ID must be a valid UUID'),
  }),
});
