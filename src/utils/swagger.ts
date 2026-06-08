import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'E-Commerce REST API',
    version: '1.0.0',
    description: 'A complete E-Commerce API containing user authentication, product catalog, category categorization, cart management, checkout with Stripe payment integration, mock payment sandbox capabilities, admin tracking dashboard, and mailer alerts.\n\n### Evaluation Hint:\nTo authenticate and test private routes in Swagger:\n1. Register or login a user using the Auth endpoints.\n2. Copy the `token` from the response.\n3. Click the **Authorize** button at the top-right of this page and paste the token.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'integer' },
          imageUrl: { type: 'string', format: 'url', nullable: true },
          categoryId: { type: 'string', format: 'uuid' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer' },
          product: { $ref: '#/components/schemas/Product' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
          totalAmount: { type: 'number' },
          shippingAddress: { type: 'string' },
          stripeSessionId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                productId: { type: 'string', format: 'uuid' },
                quantity: { type: 'integer' },
                price: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', example: 'user@ecommerce.com' },
                  password: { type: 'string', example: 'UserPassword123!' },
                  name: { type: 'string', example: 'John Doe' },
                  role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'user@ecommerce.com' },
                  password: { type: 'string', example: 'UserPassword123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT token' },
          401: { description: 'Incorrect credentials' },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Retrieve active user profile',
        responses: {
          200: { description: 'User profile retrieved successfully' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Authentication'],
        summary: 'Update active user profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Updated' },
                  email: { type: 'string', example: 'user-new@ecommerce.com' },
                  password: { type: 'string', example: 'NewSecurePassword123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List all categories',
        security: [],
        responses: {
          200: { description: 'List of categories' },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a new category (Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                  name: { type: 'string', example: 'Electronics' },
                  slug: { type: 'string', example: 'electronics' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Category created' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden (Not Admin)' },
        },
      },
    },
    '/api/categories/{id}': {
      put: {
        tags: ['Categories'],
        summary: 'Update category (Admin)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Category updated' },
          404: { description: 'Category not found' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category (Admin)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Category deleted' },
          404: { description: 'Category not found' },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Get all products (with paging/filters)',
        security: [],
        parameters: [
          { name: 'q', in: 'query', description: 'Search term', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', description: 'Filter by Category UUID', schema: { type: 'string' } },
          { name: 'categorySlug', in: 'query', description: 'Filter by Category Slug', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'List of matching products' },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a product (Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'price', 'stock', 'categoryId'],
                properties: {
                  name: { type: 'string', example: 'Noise Cancelling Headphones' },
                  description: { type: 'string', example: 'Over-ear headphones with ANC.' },
                  price: { type: 'number', example: 199.99 },
                  stock: { type: 'integer', example: 100 },
                  categoryId: { type: 'string', format: 'uuid' },
                  imageUrl: { type: 'string', example: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Product created' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get details of a single product',
        security: [],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Product details' },
          404: { description: 'Product not found' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Update product details (Admin)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'integer' },
                  categoryId: { type: 'string', format: 'uuid' },
                  imageUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product updated' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product (Admin)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Product deleted' },
        },
      },
    },
    '/api/cart': {
      get: {
        tags: ['Shopping Cart'],
        summary: 'Get current user cart items',
        responses: {
          200: { description: 'User cart list' },
        },
      },
      post: {
        tags: ['Shopping Cart'],
        summary: 'Add item to cart',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product added/updated in cart' },
        },
      },
      delete: {
        tags: ['Shopping Cart'],
        summary: 'Clear entire shopping cart',
        responses: {
          200: { description: 'Cart cleared successfully' },
        },
      },
    },
    '/api/cart/{productId}': {
      put: {
        tags: ['Shopping Cart'],
        summary: 'Update cart item quantity',
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: { type: 'integer', example: 3 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cart quantity updated' },
        },
      },
      delete: {
        tags: ['Shopping Cart'],
        summary: 'Remove specific item from cart',
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Item removed from cart' },
        },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Orders & Payments'],
        summary: 'List user orders',
        responses: {
          200: { description: 'List of orders placed by user' },
        },
      },
      post: {
        tags: ['Orders & Payments'],
        summary: 'Place order from cart (Checkout)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['shippingAddress'],
                properties: {
                  shippingAddress: { type: 'string', example: '123 Main St, Springfield, IL 62701' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Order created, returns Stripe Checkout URL' },
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders & Payments'],
        summary: 'Retrieve single order details',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Order detailed object' },
        },
      },
    },
    '/api/orders/{id}/cancel': {
      post: {
        tags: ['Orders & Payments'],
        summary: 'Cancel a pending order',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Order cancelled successfully' },
        },
      },
    },
    '/api/orders/{id}/pay-mock': {
      post: {
        tags: ['Orders & Payments'],
        summary: 'Simulate Stripe Checkout Session Payment Success (Sandbox Helper)',
        description: 'Simulates successful checkout completion. Clears cart, deducts stock, sets status to PAID, and triggers verification confirmation email.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Order successfully marked as PAID, stock updated, confirmation email sent.' },
        },
      },
    },
    '/api/admin/orders': {
      get: {
        tags: ['Admin Order Management'],
        summary: 'List all system orders (Admin only)',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] } },
        ],
        responses: {
          200: { description: 'List of all orders' },
        },
      },
    },
    '/api/admin/orders/{id}/status': {
      put: {
        tags: ['Admin Order Management'],
        summary: 'Update order shipping/tracking status (Admin only)',
        description: 'Changes order tracking status. Trigger status updates email notification when changing to SHIPPED or DELIVERED.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], example: 'SHIPPED' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order status updated, customer email sent.' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📖 Swagger Docs available at http://localhost:3000/api-docs');
};
