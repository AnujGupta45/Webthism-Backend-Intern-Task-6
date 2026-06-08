import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleared.');

  // Create Users
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  const userPassword = await bcrypt.hash('UserPassword123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ecommerce.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@ecommerce.com',
      name: 'Normal User',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('Users seeded:');
  console.log(`- Admin: admin@ecommerce.com (Password: AdminPassword123!)`);
  console.log(`- User: user@ecommerce.com (Password: UserPassword123!)`);

  // Create Categories
  const electronics = await prisma.category.create({
    data: { name: 'Electronics', slug: 'electronics' },
  });

  const fashion = await prisma.category.create({
    data: { name: 'Fashion', slug: 'fashion' },
  });

  const home = await prisma.category.create({
    data: { name: 'Home & Living', slug: 'home-living' },
  });

  console.log('Categories seeded.');

  // Create Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Smartphone Pro Max',
        description: 'Latest model with 256GB storage, triple-lens camera, and 120Hz display.',
        price: 999.99,
        stock: 50,
        categoryId: electronics.id,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      },
      {
        name: 'Ultra Slim Laptop',
        description: 'Super lightweight 14-inch laptop with 16GB RAM, 512GB SSD, and 12hr battery life.',
        price: 1299.99,
        stock: 20,
        categoryId: electronics.id,
        imageUrl: 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=500',
      },
      {
        name: 'Noise Cancelling Headphones',
        description: 'Over-ear wireless headphones with active noise cancellation and high-fidelity sound.',
        price: 199.99,
        stock: 100,
        categoryId: electronics.id,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      },
      {
        name: 'Premium Leather Jacket',
        description: 'Classic genuine leather jacket with zipper pockets and polyester lining.',
        price: 249.99,
        stock: 15,
        categoryId: fashion.id,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
      },
      {
        name: 'Retro Running Sneakers',
        description: 'Comfortable running shoes with vintage aesthetics and cushioned insoles.',
        price: 89.99,
        stock: 40,
        categoryId: fashion.id,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      },
      {
        name: 'Smart Coffee Maker',
        description: 'Wi-Fi enabled drip coffee maker. Brew your coffee using a phone app or voice assistant.',
        price: 79.99,
        stock: 30,
        categoryId: home.id,
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=500',
      },
    ],
  });

  console.log('Products seeded.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
