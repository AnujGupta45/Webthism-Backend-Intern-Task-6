import { execSync } from 'child_process';
import prisma from '../src/config/db';

// Mock MailService to prevent network requests to Ethereal Email SMTP during tests
jest.mock('../src/services/mail.service', () => ({
  MailService: {
    sendOrderConfirmation: jest.fn().mockResolvedValue({ messageId: 'mock-confirm-id' }),
    sendShippingUpdate: jest.fn().mockResolvedValue({ messageId: 'mock-shipping-id' }),
  },
}));

beforeAll(async () => {
  // Set testing environment flags
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-123456';
  
  // Build test database schema
  console.log('🔄 Setting up test database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'ignore' });
  
  await prisma.$connect();
});

beforeEach(async () => {
  // Clear all data before each test run
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
