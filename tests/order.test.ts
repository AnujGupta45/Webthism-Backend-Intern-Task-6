import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';

describe('Order System & Payments API', () => {
  let token: string;
  let adminToken: string;
  let productId: string;
  let categoryId: string;

  beforeEach(async () => {
    // Create users for customer and admin tests
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'order-user@example.com',
        password: 'password123',
        name: 'Order User',
      });
    token = userRes.body.token;

    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin-test@example.com',
        password: 'adminpassword',
        name: 'Admin User',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.token;

    // Create a product category and item with stock count
    const category = await prisma.category.create({
      data: { name: 'Test Clothes', slug: 'test-clothes' },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        name: 'Test T-Shirt',
        description: 'Test Description',
        price: 29.99,
        stock: 10,
        categoryId: category.id,
      },
    });
    productId = product.id;
  });

  it('should create a pending order from cart items', async () => {
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 2 });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: '456 Test Lane, Chicago, IL 60601',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.order).toBeDefined();
    expect(res.body.data.order.status).toBe('PENDING');
    expect(res.body.data.order.totalAmount).toBe(59.98); // 29.99 * 2
    expect(res.body.data.checkoutUrl).toBeDefined();
  });

  it('should fail checkout if cart is empty', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: '456 Test Lane, Chicago, IL 60601',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('empty');
  });

  it('should cancel a pending order', async () => {
    await request(app).post('/api/cart').set('Authorization', `Bearer ${token}`).send({ productId, quantity: 1 });
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({ shippingAddress: 'Test Addr' });
    const orderId = orderRes.body.data.order.id;

    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.order.status).toBe('CANCELLED');
  });

  it('should simulate order payment, deduct stock, clear cart, and set status to PAID', async () => {
    await request(app).post('/api/cart').set('Authorization', `Bearer ${token}`).send({ productId, quantity: 3 });
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({ shippingAddress: 'Test Addr' });
    const orderId = orderRes.body.data.order.id;

    let prod = await prisma.product.findUnique({ where: { id: productId } });
    expect(prod!.stock).toBe(10);

    const res = await request(app)
      .post(`/api/orders/${orderId}/pay-mock`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.order.status).toBe('PAID');

    prod = await prisma.product.findUnique({ where: { id: productId } });
    expect(prod!.stock).toBe(7);

    const cartRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.results).toBe(0);
  });

  it('should allow admin to view all orders and update status', async () => {
    await request(app).post('/api/cart').set('Authorization', `Bearer ${token}`).send({ productId, quantity: 1 });
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({ shippingAddress: 'Test Addr' });
    const orderId = orderRes.body.data.order.id;

    const listRes = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.results).toBeGreaterThan(0);

    const updateRes = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SHIPPED' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.order.status).toBe('SHIPPED');
  });

  it('should reject admin operations from normal users', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });
});
