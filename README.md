# 🛒 E-Commerce API (Webthism Backend Internship - Week 6)

Welcome! This is my completed backend project for **Week 6 of the Webthism Backend Development Internship**. 

I have built a fully featured, robust REST API for an e-commerce platform. To make this project as easy as possible to evaluate and run, it uses **TypeScript**, **Express**, and **Prisma ORM** with **SQLite**. This means it runs out of the box with zero external database server setup!

---

## 🚀 Quick Start (Get up and running in 2 minutes)

Follow these simple steps to run the API locally on your machine:

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy the template file:
```bash
cp .env.example .env
```
*(The defaults in `.env` are pre-configured to work immediately with SQLite and test emails.)*

### 3. Run Database Migrations
This will set up the SQLite database file and create all the tables:
```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database
Populate the database with category listings, products, a customer account, and an admin account:
```bash
npm run prisma:seed
```

### 5. Fire up the Server
Start the development server:
```bash
npm run dev
```
Once the server is running:
- The API will be active at [http://localhost:3000](http://localhost:3000)
- You can access the **interactive Swagger documentation** at [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 👥 Seeded Test Accounts

To make testing easier, the database comes pre-seeded with two accounts:

### 1. Standard Customer
* **Email**: `user@ecommerce.com`
* **Password**: `UserPassword123!`
* **Role**: `USER`

### 2. Administrator
* **Email**: `admin@ecommerce.com`
* **Password**: `AdminPassword123!`
* **Role**: `ADMIN`

---

## ✨ Features Implemented

Here's an overview of what's under the hood:

### 🔑 1. User Authentication & Profile
- Full registration and login flow using secure **JWT** tokens and **bcryptjs** password hashing.
- Profile endpoints to view and update user credentials safely.

### 📦 2. Catalog Management (Products & Categories)
- Category listing and Admin-only CRUD operations.
- Advanced product browsing with **pagination**, **searching**, **category filtration**, **price range bounds**, and **sorting** (e.g. by price or date).

### 🛒 3. Interactive Shopping Cart
- A fully managed cart system where users can add items, modify quantities, delete items, and clear their cart.
- Includes real-time **stock validation**—it won't let users add more items to their cart than are currently available in stock.

### 💳 4. Checkout & Stripe Payments
- Checks out user carts under secure **database transactions** (ensures stock updates and cart clearing are safe and atomic).
- Generates **Stripe Checkout Sessions** and handles **Stripe Webhooks** (updates order statuses to `PAID` once payment clears).
- **Grading Sandbox mode**: If you don't have Stripe keys, the API automatically uses a mock payment route (`POST /api/orders/:id/pay-mock`) to simulate successful checkouts so you can verify the stock reduction, cart clearing, and email triggers instantly.

### ✉️ 5. Automated Email Notifications
- Sends HTML emails using **Nodemailer**.
- **Order Confirmation**: Sent automatically when payment is processed.
- **Shipping Status**: Sent when an Admin updates an order's status to `SHIPPED` or `DELIVERED`.
- **Ethereal Mail Preview**: In development, emails are caught by a free testing SMTP server. The server log will print a URL (e.g., `🔗 [SMTP Preview] View sent email at...`) where you can click to see the rendered HTML email in your browser!

---

## 🧪 Running Automated Tests

I've written **18 integration tests** covering the entire user journey (Register -> Login -> Add to Cart -> Checkout -> Payment -> Admin Tracking).

To run the test suite against a clean, isolated test database:
```bash
npm run test
```
