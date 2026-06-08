import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';

describe('Shopping Cart API', () => {
  let token: string;
  let productId: string;
  let categoryId: string;

  beforeEach(async () => {
    // Create test user and obtain auth token
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'cart-user@example.com',
        password: 'password123',
        name: 'Cart User',
      });
    token = userRes.body.token;

    // Seed dummy category
    const category = await prisma.category.create({
      data: { name: 'Test Electronics', slug: 'test-electronics' },
    });
    categoryId = category.id;

    // Seed dummy product
    const product = await prisma.product.create({
      data: {
        name: 'Test Phone',
        description: 'Test Description',
        price: 499.99,
        stock: 5,
        categoryId: category.id,
      },
    });
    productId = product.id;
  });

  it('should retrieve empty cart on start', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.results).toBe(0);
    expect(res.body.totalAmount).toBe(0);
  });

  it('should add a product to the cart', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 2,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.cartItem.productId).toBe(productId);
    expect(res.body.data.cartItem.quantity).toBe(2);
  });

  it('should fail adding product to cart if quantity exceeds stock', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        quantity: 6, // Limit is 5
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('stock');
  });

  it('should update cart item quantity', async () => {
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .put(`/api/cart/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.cartItem.quantity).toBe(3);
  });

  it('should delete a product from the cart', async () => {
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .delete(`/api/cart/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');

    const checkRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(checkRes.body.results).toBe(0);
  });

  it('should clear the entire cart', async () => {
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');

    const checkRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(checkRes.body.results).toBe(0);
  });
});
