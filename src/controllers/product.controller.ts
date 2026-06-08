import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';

export class ProductController {
  public static async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        q,
        categoryId,
        categorySlug,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '10',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (q) {
        where.OR = [
          { name: { contains: q as string } },
          { description: { contains: q as string } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId as string;
      } else if (categorySlug) {
        where.category = { slug: categorySlug as string };
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice as string);
        if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder as string,
        },
        skip,
        take: limitNum,
      });

      const total = await prisma.product.count({ where });

      res.status(200).json({
        status: 'success',
        results: products.length,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        data: { products },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
      });

      if (!product) {
        throw new NotFoundError('Product not found.');
      }

      res.status(200).json({
        status: 'success',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, price, stock, categoryId, imageUrl } = req.body;

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundError('Category not found. Please provide a valid categoryId.');
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          categoryId,
          imageUrl: imageUrl || null,
        },
      });

      res.status(201).json({
        status: 'success',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, price, stock, categoryId, imageUrl } = req.body;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundError('Product not found.');
      }

      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
        });
        if (!category) {
          throw new NotFoundError('Category not found.');
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price,
          stock,
          categoryId,
          imageUrl,
        },
      });

      res.status(200).json({
        status: 'success',
        data: { product: updatedProduct },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundError('Product not found.');
      }

      await prisma.product.delete({
        where: { id },
      });

      res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
