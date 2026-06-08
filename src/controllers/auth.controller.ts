import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/errors';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-key-change-me-in-production-123456', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
  });
};

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError('A user with this email address already exists.');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'USER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = signToken(user.id);

      res.status(201).json({
        status: 'success',
        token,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedError('Incorrect email or password.');
      }

      // Generate token
      const token = signToken(user.id);

      res.status(200).json({
        status: 'success',
        token,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, email, password } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      
      if (email) {
        // Check if email is taken by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: userId },
          },
        });
        if (existingUser) {
          throw new ConflictError('A user with this email address already exists.');
        }
        updateData.email = email;
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  }
}
