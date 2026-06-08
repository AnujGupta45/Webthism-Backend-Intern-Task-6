import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { ConflictError, NotFoundError } from '../utils/errors';

export class CategoryController {
  public static async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        results: categories.length,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug } = req.body;

      const existingCategory = await prisma.category.findFirst({
        where: {
          OR: [{ name }, { slug }],
        },
      });

      if (existingCategory) {
        throw new ConflictError('Category name or slug already exists.');
      }

      const category = await prisma.category.create({
        data: { name, slug },
      });

      res.status(201).json({
        status: 'success',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, slug } = req.body;

      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundError('Category not found.');
      }

      if (name || slug) {
        const filters: any[] = [];
        if (name) filters.push({ name });
        if (slug) filters.push({ slug });

        const existingCategory = await prisma.category.findFirst({
          where: {
            OR: filters,
            id: { not: id },
          },
        });

        if (existingCategory) {
          throw new ConflictError('Category name or slug is already in use by another category.');
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: { name, slug },
      });

      res.status(200).json({
        status: 'success',
        data: { category: updatedCategory },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundError('Category not found.');
      }

      await prisma.category.delete({
        where: { id },
      });

      res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
