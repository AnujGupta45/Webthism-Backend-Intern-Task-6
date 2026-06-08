import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    description: z.string().min(5, 'Description must be at least 5 characters long'),
    price: z.number().positive('Price must be greater than zero'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    categoryId: z.string().uuid('Category ID must be a valid UUID'),
    imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    description: z.string().min(5, 'Description must be at least 5 characters long').optional(),
    price: z.number().positive('Price must be greater than zero').optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
    categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
    imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters long'),
    slug: z.string().min(2, 'Slug must be at least 2 characters long'),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters long').optional(),
    slug: z.string().min(2, 'Slug must be at least 2 characters long').optional(),
  }),
});
