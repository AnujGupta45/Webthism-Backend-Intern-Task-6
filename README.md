# Premium E-Commerce API (Node.js, Express, TypeScript, Prisma & SQLite)

A complete, production-grade E-Commerce REST API built for the **Webthism Internship Week 6 Tasks**. It implements 25 endpoints covering authentication, categories, advanced product searching/filtering, shopping cart management, Stripe checkout sessions, order tracking, webhook integration, and dynamic HTML email alerts.

SQLite is configured via Prisma ORM for convenience, meaning **no external database server installation is required** to run this project out-of-the-box.

---

## Key Features

1. **Robust Authentication**: JWT-based security with bcryptjs password hashing and role-based permissions (`USER` and `ADMIN`).
2. **Catalog Management**: Category CRUD and Product CRUD with advanced search filters, price ranges, category filtering, paging, and sorting.
3. **Shopping Cart**: Fully managed persistent cart items checking stock limits dynamically before allowing updates.
4. **Order Checkout Transaction**: Converts cart contents into orders under atomic database transactions, locking quantities, verifying stock, and clearing carts on payment.
5. **Stripe Integration**: Secure checkout sessions forwarding users to Stripe pages, with a webhook to capture payment completion events.
6. **Mock Payment Fallback**: If Stripe keys are omitted, a sandbox `/pay-mock` route handles payment simulations, allowing evaluators to verify cart clearing, stock reduction, and email triggers instantly.
7. **Email Alerts**: Automatic HTML emails for Order Confirmations and Shipping updates using Nodemailer. Integrates Ethereal Email to preview rendering in a browser without any setup.
8. **Interactive Swagger Docs**: Fully-featured Swagger UI OpenAPI docs served at `/api-docs`.
9. **Full Test Coverage**: Integration tests for Auth, Cart, and Order systems.

---

## Tech Stack
- **Runtime & Language**: Node.js, TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma ORM with SQLite
- **Payments**: Stripe API
- **Emails**: Nodemailer (with dynamic Ethereal SMTP fallback)
- **API Documentation**: Swagger UI & OpenAPI 3.0
- **Testing**: Jest & Supertest

---

## Quick Start

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template and adjust values if needed:
```bash
cp .env.example .env
```
*(By default, `.env` works out-of-the-box with SQLite and Ethereal Email.)*

### 3. Run Database Migrations
Sync database and generate the Prisma client:
```bash
npx prisma migrate dev --name init
```

### 4. Seed Database
Seeding populates initial categories, products, and default accounts (Admin and Customer):
```bash
npm run prisma:seed
```

### 5. Start Server
Run the hot-reloading development server:
```bash
npm run dev
```
The server will start on [http://localhost:3000](http://localhost:3000).
Interactive Swagger Documentation will be available at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

---

## Seeded User Credentials
You can use these accounts to log in and test endpoints:

* **Admin User**:
  - Email: `admin@ecommerce.com`
  - Password: `AdminPassword123!`
  - Role: `ADMIN`

* **Standard Customer**:
  - Email: `user@ecommerce.com`
  - Password: `UserPassword123!`
  - Role: `USER`

---

## Detailed API Endpoints (25 Total)

### 1. Authentication (`/api/auth`)
| HTTP Method | Route | Description | Auth Required | Input |
|-------------|-------|-------------|---------------|-------|
| `POST` | `/register` | Register new customer or admin | None | Body: `email`, `password`, `name`, `role` (optional) |
| `POST` | `/login` | Log in user, returns JWT token | None | Body: `email`, `password` |
| `GET` | `/profile` | Retrieve current user profile details | JWT User | None |
| `PUT` | `/profile` | Modify current user profile | JWT User | Body: `name`, `email`, `password` (optional) |

### 2. Category Catalog (`/api/categories`)
| HTTP Method | Route | Description | Auth Required | Input |
|-------------|-------|-------------|---------------|-------|
| `GET` | `/` | List all categories | None | Query: none |
| `POST` | `/` | Create a category | JWT Admin | Body: `name`, `slug` |
| `PUT` | `/:id` | Update category details | JWT Admin | Params: `id`. Body: `name`, `slug` (optional) |
| `DELETE` | `/:id` | Delete a category | JWT Admin | Params: `id` |

### 3. Product Catalog (`/api/products`)
| HTTP Method | Route | Description | Auth Required | Input |
|-------------|-------|-------------|---------------|-------|
| `GET` | `/` | Query products (supports paginating/search) | None | Queries: `q`, `categoryId`, `categorySlug`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `page`, `limit` |
| `GET` | `/:id` | Retrieve product details | None | Params: `id` |
| `POST` | `/` | Add a product to the catalog | JWT Admin | Body: `name`, `description`, `price`, `stock`, `categoryId`, `imageUrl` (opt) |
| `PUT` | `/:id` | Update product details | JWT Admin | Params: `id`. Body: optional updates |
| `DELETE` | `/:id` | Remove a product | JWT Admin | Params: `id` |

### 4. Shopping Cart (`/api/cart`)
| HTTP Method | Route | Description | Auth Required | Input |
|-------------|-------|-------------|---------------|-------|
| `GET` | `/` | Retrieve your cart contents | JWT User | None |
| `POST` | `/` | Add product to cart (increments qty) | JWT User | Body: `productId`, `quantity` |
| `PUT` | `/:productId`| Update specific cart quantity | JWT User | Params: `productId`. Body: `quantity` |
| `DELETE` | `/:productId`| Remove item from cart | JWT User | Params: `productId` |
| `DELETE` | `/` | Clear cart | JWT User | None |

### 5. Checkout & Payments (`/api/orders` & `/api/payments`)
| HTTP Method | Route | Description | Auth Required | Input |
|-------------|-------|-------------|---------------|-------|
| `POST` | `/api/orders` | Checkout cart, returns Stripe URL | JWT User | Body: `shippingAddress` |
| `GET` | `/api/orders` | List your orders history | JWT User | None |
| `GET` | `/api/orders/:id`| Get specific order details | JWT User | Params: `id` |
| `POST` | `/api/orders/:id/cancel`| Cancel a pending order | JWT User | Params: `id` |
| `POST` | `/api/orders/:id/pay-mock`| Simulate payment success | JWT User/Admin| Params: `id` |
| `POST` | `/api/payments/webhook`| Stripe Webhook handler | Stripe Hook | Headers: `stripe-signature`. Raw Body. |

### 6. Admin Order Tracking (`/api/admin/orders`)
| HTTP Method | Route | Description | Auth Required | Input |
|-------------|-------|-------------|---------------|-------|
| `GET` | `/` | List all system orders | JWT Admin | Query: `status` (optional) |
| `PUT` | `/:id/status`| Update status (triggers emails) | JWT Admin | Params: `id`. Body: `status` |

---

## Stripe Webhook & Payment Flow

1. Customer checks out cart via `POST /api/orders` sending a shipping address.
2. The API creates an order in `PENDING` state and queries Stripe to create a checkout session.
3. The API returns a Stripe Checkout URL (e.g. `https://checkout.stripe.com/c/pay/...`).
4. If Stripe keys are omitted, the session creates a mock URL leading to the `/pay-mock` endpoint.
5. In production/test: Stripe fires a secure `checkout.session.completed` event to `/api/payments/webhook`.
6. The API verifies signature, processes stock deductions inside a transaction, clears the user's cart, sets order status to `PAID`, and triggers an HTML Order Confirmation email.

---

## Nodemailer Ethereal Email previews

When the API runs locally without a custom SMTP configure, it dynamically registers a test account at startup:
- Logs like: `🔗 [SMTP Preview] View sent email at: https://ethereal.email/message/...` will print to the console.
- Click that URL to open a browser window displaying the rendered HTML email containing invoice details, items table, and statuses.

---

## Running Automated Tests

Run Jest integration tests which cover user flow paths (runs against a separate, auto-configured SQLite `test.db` file):
```bash
npm run test
```
