# AgriConnect

A full-stack farming marketplace platform with AI-powered plant health analysis, real-time chat, and secure payment processing via Razorpay. Built with Node.js, Express, PostgreSQL, Redis, and Socket.io following MVC architecture.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication & Token Flow](#authentication--token-flow)
- [Product Flow](#product-flow)
- [Add to Cart to Checkout Flow](#add-to-cart-to-checkout-flow)
- [Payment & Checkout (Razorpay)](#payment--checkout-razorpay)
- [Order Management](#order-management)
- [Real-Time Chat (Socket.io)](#real-time-chat-socketio)
- [AI Plant Health Prediction](#ai-plant-health-prediction)
- [Redis Caching Strategy](#redis-caching-strategy)
- [SQL & Database Optimizations](#sql--database-optimizations)
- [Supabase Configuration](#supabase-configuration)
- [Error Handling](#error-handling)
- [Cybersecurity Implementation](#cybersecurity-implementation)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20.x | Runtime environment |
| **Express.js** | 4.21.2 | Web framework |
| **PostgreSQL** | - | Primary relational database |
| **Redis (ioredis)** | 5.9.3 | Caching layer & token blacklisting |
| **Socket.io** | 4.8.3 | Real-time bidirectional WebSocket communication |
| **Razorpay** | 2.9.6 | Payment gateway (INR) |
| **Supabase** | 2.96.0 | File storage (product images) |
| **JSON Web Tokens** | 9.0.3 | Authentication (access + refresh tokens) |
| **bcrypt** | 5.1.1 | Password hashing (10 salt rounds) |
| **Zod** | 4.3.6 | Runtime schema validation |
| **Multer** | 1.4.5 | Multipart file upload handling |
| **Helmet** | 8.1.0 | HTTP security headers & CSP |
| **express-rate-limit** | 8.2.1 | Rate limiting per endpoint |
| **Morgan** | 1.10.1 | HTTP request logging |
| **Compression** | 1.8.1 | Gzip response compression |
| **Axios** | 1.8.3 | HTTP client for external API calls |
| **dotenv** | 16.4.7 | Environment variable management |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |
| **pg** | 8.13.1 | PostgreSQL client with connection pooling |

### Frontend

| Technology | Purpose |
|---|---|
| **Vanilla HTML/CSS/JS** | 18 pages, 19 CSS files, 10+ JS files |
| **Socket.io Client** | Real-time chat on frontend |
| **Razorpay Checkout.js** | Hosted payment form |
| **CDN Libraries** | Font Awesome, Google Fonts |

### External Services

| Service | Purpose |
|---|---|
| **Supabase** | PostgreSQL database hosting + file storage bucket |
| **Razorpay** | Payment processing gateway |
| **Hugging Face API** | AI plant disease detection model |
| **Render** | Deployment platform |

---

## Architecture

### MVC (Model-View-Controller) Pattern

The backend follows a modular MVC architecture with clear separation of concerns:

```
Request
  |
  v
Routes (endpoint definitions + middleware chain)
  |
  v
Middleware Stack (auth -> role check -> validation -> caching)
  |
  v
Controllers (HTTP handling, request/response formatting)
  |
  v
Services (business logic, transactions, validations)
  |
  v
Models (parameterized SQL queries, database operations)
  |
  v
Database (PostgreSQL via connection pool)
```

### Middleware Chain Example

```
POST /api/orders
  -> verifyToken        (JWT authentication)
  -> requireRole("customer")  (RBAC enforcement)
  -> validate(schema)   (Zod schema validation)
  -> controller         (business logic handler)
  -> errorHandler       (global error catch)
```

Each business domain is a self-contained module under `src/modules/`:

```
src/modules/{module}/
  ├── {module}.routes.js       # Route definitions + middleware binding
  ├── {module}.controller.js   # HTTP request handlers
  ├── {module}.service.js      # Business logic & transactions
  ├── {module}.model.js        # Database queries (parameterized SQL)
  └── {module}.validation.js   # Zod schemas for input validation
```

---

## Project Structure

```
AgriConnect/
├── src/
│   ├── server.js                    # Server entry point, graceful shutdown
│   ├── app.js                       # Express app config, middleware stack
│   │
│   ├── config/
│   │   ├── database.js              # PostgreSQL pool (max 3, SSL, keepalive)
│   │   ├── redis.js                 # Redis client (ioredis, TLS, retry)
│   │   ├── socket.js                # Socket.io init, auth, chat events
│   │   └── supabase.js              # Supabase client for file storage
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification + role-based access
│   │   ├── cache.js                 # Redis response caching middleware
│   │   ├── errorHandler.js          # Global error handler
│   │   ├── upload.js                # Multer config (5MB, images only)
│   │   └── validate.js              # Zod schema validation middleware
│   │
│   ├── modules/
│   │   ├── auth/                    # Signup, login, refresh, logout, profile
│   │   ├── product/                 # CRUD for farmer products
│   │   ├── cart/                    # Cart management + checkout
│   │   ├── order/                   # Order lifecycle management
│   │   ├── payment/                 # Razorpay integration + webhooks
│   │   ├── chat/                    # REST endpoints for chat history
│   │   ├── review/                  # Product reviews & ratings
│   │   ├── prediction/             # AI plant health analysis
│   │   ├── address/                 # Delivery address management
│   │   ├── health/                  # System health checks
│   │   └── pages/                   # Static page serving routes
│   │
│   └── utils/
│       ├── tokenUtils.js            # JWT generate/verify helpers
│       ├── AppError.js              # Custom operational error class
│       └── catchAsync.js            # Async error wrapper
│
├── public/
│   ├── pages/                       # 18 HTML pages
│   ├── js/                          # Client-side JavaScript
│   ├── css/                         # 19 stylesheets
│   └── images/                      # Static assets
│
├── .env                             # Environment variables
├── .gitignore
└── package.json
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | No | - | Register new user (farmer/customer) |
| `POST` | `/api/auth/login` | No | - | Login with phone + password |
| `POST` | `/api/auth/refresh` | No | - | Refresh access token using refresh token |
| `POST` | `/api/auth/logout` | No | - | Logout and blacklist refresh token |
| `GET` | `/api/auth/verify` | Yes | Any | Verify token and get user profile |
| `PUT` | `/api/auth/profile` | Yes | Any | Update username and delivery address |

**Rate Limit:** 20 requests / 15 minutes

### Products (`/api/products`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/products` | No | - | List products with search, filter, pagination. **Cached 300s.** |
| `POST` | `/api/products` | Yes | Farmer | Create product with image upload to Supabase |
| `PUT` | `/api/products/:id` | Yes | Farmer | Update product (ownership verified) |
| `DELETE` | `/api/products/:id` | Yes | Farmer | Delete product + cleanup Supabase image |

**Query Params for GET:** `farmer_id`, `category`, `search` (ILIKE), `page`, `limit` (max 100)

### Cart (`/api/cart`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/cart` | Yes | Customer | Add to cart (upsert on conflict) |
| `GET` | `/api/cart` | Yes | Customer | Get cart with subtotals. **Cached 60s.** |
| `PUT` | `/api/cart/:id` | Yes | Customer | Update item quantity (max 9999) |
| `DELETE` | `/api/cart/:id` | Yes | Customer | Remove single cart item |
| `DELETE` | `/api/cart` | Yes | Customer | Clear entire cart |
| `POST` | `/api/cart/checkout` | Yes | Customer | Checkout cart without payment gateway |

### Orders (`/api/orders`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/orders` | Yes | Customer | Create single direct order (stock deducted atomically) |
| `GET` | `/api/orders` | Yes | Any | List orders (customer sees own, farmer sees orders for their products). **Cached 120s.** |
| `GET` | `/api/orders/:id` | Yes | Any | Get order details (participant only) |
| `PUT` | `/api/orders/:id` | Yes | Farmer | Update order status (validated transitions) |
| `PUT` | `/api/orders/:id/cancel` | Yes | Customer | Cancel order + restore stock |

### Payment (`/api/payment`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/payment/create-order` | Yes | Customer | Create Razorpay order from cart |
| `POST` | `/api/payment/verify` | Yes | Customer | Verify payment signature + create orders |
| `GET` | `/api/payment/status/:paymentId` | Yes | Any | Get payment status from Razorpay |
| `POST` | `/api/payment/webhook` | No | - | Razorpay webhook (HMAC-SHA256 verified) |

### Reviews (`/api/reviews`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/reviews` | Yes | Customer | Submit review (order must be delivered) |
| `GET` | `/api/reviews/product/:productId` | No | - | Get reviews + average rating |
| `GET` | `/api/reviews/check/:orderId` | Yes | Customer | Check if order already reviewed |

### Plant Health Prediction (`/api/predict`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/predict/analyze` | Yes | Farmer | Upload plant image for AI disease analysis |
| `GET` | `/api/predict/:id` | Yes | Farmer | Get prediction result. **Cached 1800s.** |

### Addresses (`/api/addresses`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/addresses` | Yes | Any | Add delivery address |
| `GET` | `/api/addresses` | Yes | Any | List all user addresses |
| `GET` | `/api/addresses/:id` | Yes | Any | Get specific address |
| `PUT` | `/api/addresses/:id` | Yes | Any | Update address |
| `DELETE` | `/api/addresses/:id` | Yes | Any | Delete address |
| `PATCH` | `/api/addresses/:id/default` | Yes | Any | Set as default address |

### Chat (`/api/chat`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/chat/:orderId` | Yes | Any | Get chat message history for order |
| `GET` | `/api/chat/:orderId/info` | Yes | Any | Get chat metadata (participants, status) |

### Health Checks (`/health`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Overall system health |
| `GET` | `/health/db` | Database connection + latency |
| `GET` | `/health/redis` | Redis connection + write/read test |
| `GET` | `/health/auth` | JWT configuration check |
| `GET` | `/health/storage` | Supabase storage configuration |
| `GET` | `/health/env` | Environment variable check |
| `GET` | `/health/all` | Comprehensive health check |

---

## Authentication & Token Flow

### Token Architecture

```
                     ┌─────────────────────┐
                     │   JWT_SECRET         │──> Access Token (15 min)
                     │   JWT_REFRESH_SECRET │──> Refresh Token (7 days)
                     └─────────────────────┘

Access Token Payload:  { userId, role, type: "access" }
Refresh Token Payload: { userId, role, type: "refresh" }
Algorithm: HS256 (HMAC SHA-256)
```

### Signup Flow

```
Client                          Server
  |                               |
  |  POST /api/auth/signup        |
  |  { username, phone,           |
  |    password, role }           |
  |  ──────────────────────────>  |
  |                               |  1. Validate input (Zod schema)
  |                               |  2. Check phone uniqueness (SELECT 1 FROM users)
  |                               |  3. Hash password: bcrypt.hash(password, 10)
  |                               |  4. INSERT INTO users (username, phone_no, password, role)
  |                               |  5. Generate access + refresh tokens
  |  <──────────────────────────  |
  |  { accessToken, refreshToken, |
  |    userId }                   |
  |                               |
  |  Store in localStorage:       |
  |    agriconnect_token           |
  |    agriconnect_refresh_token   |
  |    agriconnect_user            |
```

### Login Flow

```
Client                          Server
  |                               |
  |  POST /api/auth/login         |
  |  { phone, password, role }    |
  |  ──────────────────────────>  |
  |                               |  1. Validate input (Zod)
  |                               |  2. Find user: WHERE phone_no = $1 AND role = $2
  |                               |  3. Compare: bcrypt.compare(password, hash)
  |                               |  4. Generic error: "Invalid phone or password."
  |                               |     (prevents user enumeration)
  |                               |  5. Generate tokens
  |  <──────────────────────────  |
  |  { accessToken, refreshToken, |
  |    userId, username, role }   |
```

### Token Refresh Flow

```
Client                          Server                    Redis
  |                               |                        |
  |  POST /api/auth/refresh       |                        |
  |  { refreshToken }             |                        |
  |  ──────────────────────────>  |                        |
  |                               |  1. Check blacklist ──>| GET blacklist:{token}
  |                               |     If blacklisted:    |
  |                               |     throw "Token revoked" |
  |                               |                        |
  |                               |  2. Verify JWT signature|
  |                               |  3. Blacklist old ────>| SET blacklist:{old} (7d TTL)
  |                               |  4. Generate new pair  |
  |  <──────────────────────────  |                        |
  |  { accessToken, refreshToken }|                        |
```

### Logout Flow

```
Client                          Server                    Redis
  |                               |                        |
  |  POST /api/auth/logout        |                        |
  |  { refreshToken }             |                        |
  |  ──────────────────────────>  |                        |
  |                               |  Blacklist token ────> | SET blacklist:{token} (7d TTL)
  |                               |                        |
  |  <──────────────────────────  |
  |  Clear localStorage:          |
  |    - agriconnect_token        |
  |    - agriconnect_refresh_token|
  |    - agriconnect_user         |
  |  Redirect to home page        |
```

### Automatic Token Refresh (Frontend)

```javascript
// On any 401 response:
// 1. Set isRefreshing flag (deduplication)
// 2. POST /api/auth/refresh with stored refresh token
// 3. Update localStorage with new tokens
// 4. Retry original request with new access token
// 5. If refresh fails -> clear auth, redirect to login

// Concurrent requests during refresh are queued via Promise
```

### Frontend Page Guards

```
Authenticated pages: /dashboard/*, /cart, /orders, /chat, /profile, etc.
  -> If no token: redirect to login page

Guest-only pages: /login/*, /signup/*
  -> If token exists: redirect to dashboard

Role-based pages:
  -> /marketplace/farmer -> only farmers
  -> /marketplace/customer -> only customers
  -> window.history.replaceState() prevents back-button to login
```

---

## Product Flow

### Create Product (Farmer)

```
POST /api/products
  |
  v
[verifyToken] -> [requireRole("farmer")] -> [upload.single("productImage")] -> [validate]
  |
  v
Controller -> Service:
  1. Validate file exists (image required)
  2. Validate data: name, price (0-20000), quantity (0-2000), description, category, unit
  3. Upload image to Supabase Storage:
     - Path: products/{farmerId}/{timestamp}-{random}.ext
     - Returns public URL
  4. INSERT INTO products (...) RETURNING id
  5. Invalidate cache: products:*
  |
  v
Response: { success: true, productId: 123 }
```

### Read Products (Public)

```
GET /api/products?farmer_id=10&category=Seeds&search=tomato&page=1&limit=20
  |
  v
[validate] -> [cacheMiddleware(300s)]
  |
  v
Cache Key: products:{farmerId}:cat:{category}:search:{search}:page:{page}:limit:{limit}
  |
  v (cache miss)
SQL:
  SELECT p.*, u.phone_no, u.username
  FROM products p
  LEFT JOIN users u ON p.farmer_id = u.id
  WHERE p.product_name ILIKE '%tomato%'    -- case-insensitive search
    AND p.category = 'Seeds'
    AND p.farmer_id = 10
  ORDER BY p.id DESC
  LIMIT 20 OFFSET 0

  + COUNT(*) query for pagination metadata
  |
  v
Response: { products: [...], total, page, limit, totalPages }
```

### Update Product (Farmer, ownership verified)

```
PUT /api/products/:id
  |
  v
1. Fetch product, verify product.farmer_id === req.user.userId
2. If new image:
   - Delete old image from Supabase
   - Upload new image
3. UPDATE products SET ... WHERE id = $1 (uses COALESCE for partial updates)
4. Invalidate cache: products:*
```

### Delete Product (Farmer, ownership verified)

```
DELETE /api/products/:id
  |
  v
1. Verify ownership
2. Delete image from Supabase Storage
3. DELETE FROM products WHERE id = $1
4. Invalidate cache: products:*
```

---

## Add to Cart to Checkout Flow

### Step 1: Add to Cart

```
Customer clicks "Add to Cart" on product card
  |
  v
Frontend Validation:
  - Check if logged in (if not -> redirect to /login/customer)
  |
  v
POST /api/cart { product_id: 123, quantity: 5 }
  |
  v
Backend Validations:
  1. Product exists? (SELECT from products)
  2. Not own product? (farmer_id !== customerId, prevents self-purchase)
  |
  v
SQL (Upsert - handles duplicate adds):
  INSERT INTO cart_items (customer_id, product_id, quantity)
  VALUES ($1, $2, $3)
  ON CONFLICT (customer_id, product_id)
  DO UPDATE SET quantity = cart_items.quantity + $3
  RETURNING id, quantity
  |
  v
Cache Invalidation: cart:{customerId}*
Response: { success: true, message: "Added to cart.", cartItem: { id, quantity } }
```

### Step 2: View Cart

```
GET /api/cart
  |
  v
Cache Check: cart:{customerId} (60s TTL)
  |
  v (cache miss)
SQL:
  SELECT ci.id, ci.product_id, ci.quantity,
         p.product_name, p.price, p.image, p.quantity_unit,
         p.quality, p.quantity AS stock, u.username AS farmer_name
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  JOIN users u ON p.farmer_id = u.id
  WHERE ci.customer_id = $1
  ORDER BY ci.created_at DESC
  |
  v
Calculate subtotals per item + cart total
Cache result (60s TTL)
  |
  v
Response: { items: [...], cartTotal: 752.50, itemCount: 3 }
```

### Step 3: Update / Remove Cart Items

```
PUT /api/cart/:id  { quantity: 10 }
  -> Verify ownership (cart_item.customer_id === userId)
  -> UPDATE cart_items SET quantity = $1 WHERE id = $2
  -> Invalidate cache

DELETE /api/cart/:id
  -> DELETE FROM cart_items WHERE id = $1 AND customer_id = $2
  -> Invalidate cache

DELETE /api/cart
  -> DELETE FROM cart_items WHERE customer_id = $1
  -> Invalidate cache
```

### Step 4: Checkout (Payment Flow)

```
Customer clicks "Pay & Place Order"
  |
  v
POST /api/payment/create-order { delivery_address: "..." }
  |
  v
Backend:
  1. Fetch all cart items with product details
  2. Validate: cart not empty, no self-purchase, stock available
  3. Calculate total amount
  4. Create Razorpay order:
     razorpay.orders.create({
       amount: totalAmount * 100,  // Convert to paise
       currency: "INR",
       receipt: "cart_{customerId}_{timestamp}"
     })
  5. Return razorpay_order_id + amount + key_id to frontend
  |
  v
Frontend opens Razorpay Checkout form
  -> Customer enters payment details (card/UPI/netbanking/wallet)
  -> Razorpay processes payment
  -> Returns: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  |
  v
POST /api/payment/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  |
  v
Backend Verification:
  1. HMAC-SHA256 signature verification:
     expected = HMAC("sha256", KEY_SECRET, "order_id|payment_id")
     Compare expected === received signature
  2. Fetch payment from Razorpay API: razorpay.payments.fetch(payment_id)
  3. Validate status: "captured" or "authorized"
  4. Idempotency check: existing orders with same razorpay_order_id?
  |
  v
Database Transaction (BEGIN):
  5. Lock cart items: SELECT ... FOR UPDATE (prevents race conditions)
  6. For each cart item:
     a. Validate stock availability
     b. INSERT INTO orders (customer_id, product_id, quantity, total_price,
                            status='pending', razorpay_order_id, razorpay_payment_id,
                            payment_status='paid')
     c. UPDATE products SET quantity = quantity - ordered_qty
  7. Clear cart: DELETE FROM cart_items WHERE customer_id = $1
  8. COMMIT
  |
  v
Cache Invalidation: cart:*, orders:*, products:*
  |
  v
Response: { orderIds: [101, 102], payment: { amount, method, status } }
  |
  v
Frontend: Show success modal with payment details
         -> "View Orders" button
```

### Checkout Without Payment (Alternative Path)

```
POST /api/cart/checkout { delivery_address: "..." }
  |
  v
Same flow but without Razorpay:
  - Groups cart items by farmer (one order per farmer)
  - Transaction: validate stock -> create orders -> reduce stock -> clear cart
  - No payment verification step
```

---

## Payment & Checkout (Razorpay)

### Integration Architecture

```
                    ┌─────────────┐
                    │   Frontend   │
                    └──────┬──────┘
                           |
              1. Create    |  4. Verify
                 Order     |     Payment
                           |
                    ┌──────┴──────┐
                    │   Backend    │
                    └──────┬──────┘
                           |
              2. Create    |  3. Payment    5. Webhook
                 Order     |     Response      Events
                           |
                    ┌──────┴──────┐
                    │   Razorpay   │
                    └─────────────┘
```

### Amount Handling

```
Frontend Amount:  Rs 500.00
  -> Backend:     500 * 100 = 50000 paise
  -> Razorpay:    50000 (smallest currency unit)
  -> Response:    50000 / 100 = Rs 500.00 (display)
```

### Signature Verification

```javascript
// Payment verification (order_id|payment_id format)
expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

// Webhook verification (full body JSON)
expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
  .update(JSON.stringify(body))
  .digest("hex");
```

### Webhook Events Handled

| Event | Action |
|---|---|
| `payment.captured` | Set `payment_status = 'paid'` |
| `payment.authorized` | Set `payment_status = 'paid'` |
| `payment.failed` | Set `payment_status = 'failed'` |
| Other events | Ignored |

### Idempotency

Duplicate payment prevention:
- Before creating orders, check: `SELECT id FROM orders WHERE razorpay_order_id = $1`
- If orders exist, return `{ alreadyProcessed: true }` without re-processing

### Supported Payment Methods

Card, UPI, Net Banking, Wallet, EMI, Bank Transfer (via Razorpay hosted checkout)

---

## Order Management

### Order Status Lifecycle

```
                    ┌──────────┐
         ┌─────────│  pending  │─────────┐
         │         └────┬─────┘         │
         │              │               │
         │     Farmer   │   Customer    │
         │    accepts   │   cancels     │
         │              v               v
         │         ┌──────────┐   ┌───────────┐
         │         │ accepted │   │ cancelled │
         │         └────┬─────┘   └───────────┘
         │              │
         │     Farmer   │
         │     ships    │
         │              v
         │         ┌──────────┐
         │         │ shipped  │
         │         └────┬─────┘
         │              │
         │     Farmer   │
         │    delivers  │
         │              v
         │         ┌──────────┐
         └─────────│ delivered│
                   └──────────┘
```

### Valid Status Transitions (enforced in code)

| Current Status | Allowed Next Status | Who Can Update |
|---|---|---|
| `pending` | `accepted` | Farmer |
| `accepted` | `shipped` | Farmer |
| `shipped` | `delivered` | Farmer |
| `pending`, `accepted` | `cancelled` | Customer |
| `delivered` | - | Terminal state |
| `cancelled` | - | Terminal state |

### Order Cancellation (Stock Restoration)

```
PUT /api/orders/:id/cancel
  |
  v
Transaction (BEGIN):
  1. SELECT ... FROM orders WHERE id = $1 FOR UPDATE (row lock)
  2. Verify: customer_id matches, status in [pending, accepted]
  3. UPDATE orders SET status = 'cancelled' WHERE id = $1
  4. UPDATE products SET quantity = quantity + order.quantity WHERE id = product_id
  5. COMMIT
  6. Invalidate cache: orders:*, products:*
```

---

## Real-Time Chat (Socket.io)

### Connection & Authentication

```javascript
// Client-side connection with JWT
const socket = io({
  auth: { token: accessToken }
});

// Server-side authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = verifyAccessToken(token);
  socket.user = { userId: decoded.userId, role: decoded.role };
  next();
});
```

### WebSocket Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_order` | Client -> Server | `{ orderId }` | Join order-specific chat room |
| `joined` | Server -> Client | `{ orderId }` | Confirmation of room join |
| `send_message` | Client -> Server | `{ orderId, message }` | Send chat message (1-300 chars) |
| `new_message` | Server -> Client | `{ id, order_id, sender_id, sender_role, message, created_at }` | Broadcast to room |
| `chat_error` | Server -> Client | `string` | Error notification |

### Chat Rules

- **Access Control:** Only order participants (customer + farmer) can join/send
- **Status Restriction:** Chat only available for `pending` orders
- **Rate Limiting:** Customers limited to 1 message per hour per order
- **Message Validation:** 1-300 characters, trimmed
- **Persistence:** All messages stored in `chat_messages` table
- **Rooms:** `order_{orderId}` - isolated per order

---

## AI Plant Health Prediction

### Flow

```
Farmer uploads plant image
  |
  v
POST /api/predict/analyze (multipart/form-data)
  - imageInput: image file (JPEG/PNG/WebP/GIF, max 5MB)
  - description: optional text
  - language: optional (default "en")
  |
  v
1. INSERT INTO predictions (farmer_id, image_path, description, language, status='analyzing')
2. Send image to Hugging Face API via Axios POST (multipart/form-data)
3. Parse response: { diagnosis, confidence, details }
4. UPDATE predictions SET prediction_result = $1, status = 'complete'
5. If API fails: SET status = 'failed', retry once
  |
  v
GET /api/predict/:id (cached 1800s in Redis)
  -> Returns prediction result with diagnosis, confidence, details
```

---

## Redis Caching Strategy

### Cache Keys & TTL

| Key Pattern | TTL | Description |
|---|---|---|
| `products:{farmerId}:cat:{cat}:search:{s}:page:{p}:limit:{l}` | 300s | Product listings |
| `cart:{customerId}` | 60s | Shopping cart contents |
| `orders:{role}:{userId}:page:{p}:limit:{l}` | 120s | Order listings |
| `reviews:product:{productId}` | 180s | Product reviews + avg rating |
| `user:profile:{userId}` | 600s | User profile data |
| `prediction:{predictionId}` | 1800s | AI prediction results |
| `blacklist:{refreshToken}` | 604800s (7d) | Revoked refresh tokens |

### Cache Invalidation

```
Pattern-based invalidation using SCAN (non-blocking):

Product CRUD  -> cacheInvalidatePattern("products:*")
Cart changes  -> cacheInvalidatePattern("cart:{customerId}*")
Order changes -> cacheInvalidatePattern("orders:*")
Review added  -> cacheInvalidatePattern("reviews:product:{productId}")
Profile update -> cacheDel("user:profile:{userId}")
```

### Graceful Degradation

```
If Redis is unavailable:
  - isRedisConnected flag checked before every operation
  - All cache operations return null/void silently
  - Application continues with direct database queries
  - No errors thrown to client
```

### Response Caching Middleware

```javascript
// Applied to GET endpoints
cacheMiddleware(keyFn, ttlSeconds)
  -> Check Redis for cached response
  -> If hit: return cached JSON directly
  -> If miss: intercept res.json(), cache successful (2xx) responses
```

---

## SQL & Database Optimizations

### Connection Pooling

```javascript
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 3,                            // Max concurrent connections
  idleTimeoutMillis: 30000,          // Close idle connections after 30s
  connectionTimeoutMillis: 10000,    // Connection timeout 10s
  keepAlive: true,                   // TCP keepalive enabled
  keepAliveInitialDelayMillis: 10000,
  ssl: { rejectUnauthorized: false }
});
```

### Query Patterns

**Parameterized Queries (SQL injection prevention):**

```sql
-- All queries use $1, $2, $3 placeholders
SELECT * FROM users WHERE phone_no = $1 AND role = $2
INSERT INTO orders (...) VALUES ($1, $2, $3, $4)
```

**Pessimistic Locking (race condition prevention):**

```sql
-- Used in order creation and payment verification
SELECT price, quantity AS stock, farmer_id
FROM products WHERE id = $1
FOR UPDATE  -- Row-level lock until transaction commits
```

**Upsert Pattern (cart add):**

```sql
INSERT INTO cart_items (customer_id, product_id, quantity)
VALUES ($1, $2, $3)
ON CONFLICT (customer_id, product_id)
DO UPDATE SET quantity = cart_items.quantity + $3
RETURNING id, quantity
```

**Partial Updates (COALESCE):**

```sql
UPDATE products SET
  product_name = COALESCE($1, product_name),
  price = COALESCE($2, price),
  quantity = COALESCE($3, quantity)
WHERE id = $4
```

**Pagination:**

```sql
SELECT ... ORDER BY id DESC LIMIT $1 OFFSET $2
+ separate COUNT(*) query for total
```

**Multi-table JOINs:**

```sql
-- Orders with product and user details
SELECT o.*, p.product_name, p.price, u.username
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN users u ON p.farmer_id = u.id
WHERE o.customer_id = $1
ORDER BY o.id DESC
```

### Transaction Handling

```javascript
const client = await pool.connect();
try {
  await client.query("BEGIN");

  // Multiple operations as atomic unit
  const product = await client.query("SELECT ... FOR UPDATE", [productId]);
  await client.query("INSERT INTO orders ...", [...]);
  await client.query("UPDATE products SET quantity = quantity - $1", [qty]);

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release(); // Always return connection to pool
}
```

### Auto-Migrations on Startup

```sql
-- Column renames
ALTER TABLE predictions RENAME COLUMN gemini_details TO prediction_result;

-- Add constraints
ALTER TABLE cart_items ADD CONSTRAINT cart_items_customer_product_unique
  UNIQUE (customer_id, product_id);

-- Add columns
ALTER TABLE users ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';

-- Create tables
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'Home',
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │   products   │     │    orders    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │<───>│ farmer_id(FK)│     │ id (PK)      │
│ username     │     │ product_name │     │ customer_id  │──> users.id
│ phone_no     │     │ price        │     │ product_id   │──> products.id
│ password     │     │ quantity     │     │ quantity     │
│ role         │     │ quality      │     │ total_price  │
│ delivery_addr│     │ description  │     │ status       │
└──────┬───────┘     │ image        │     │ delivery_addr│
       │             │ quantity_unit│     │ razorpay_*   │
       │             │ category     │     │ payment_status│
       │             └──────────────┘     └──────────────┘
       │
       │             ┌──────────────┐     ┌──────────────┐
       │             │  cart_items   │     │   reviews    │
       │             ├──────────────┤     ├──────────────┤
       ├────────────>│ customer_id  │     │ order_id     │
       │             │ product_id   │     │ product_id   │
       │             │ quantity     │     │ customer_id  │
       │             │ UNIQUE(c,p)  │     │ rating (1-5) │
       │             └──────────────┘     │ feedback     │
       │                                  └──────────────┘
       │
       │             ┌──────────────┐     ┌──────────────┐
       │             │  addresses   │     │chat_messages │
       │             ├──────────────┤     ├──────────────┤
       ├────────────>│ user_id (FK) │     │ order_id     │
       │             │ label        │     │ sender_id    │
       │             │ full_name    │     │ sender_role  │
       │             │ phone        │     │ message      │
       │             │ address_*    │     │ created_at   │
       │             │ city, state  │     └──────────────┘
       │             │ pincode      │
       │             │ is_default   │     ┌──────────────┐
       │             └──────────────┘     │ predictions  │
       │                                  ├──────────────┤
       └─────────────────────────────────>│ farmer_id    │
                                          │ image_path   │
                                          │ description  │
                                          │ language     │
                                          │ prediction_  │
                                          │   result     │
                                          │ status       │
                                          └──────────────┘
```

---

## Supabase Configuration

### What's Configured

| Feature | Status | Details |
|---|---|---|
| **Database Hosting** | Active | PostgreSQL database hosted on Supabase |
| **File Storage** | Active | `uploads` bucket for product images and prediction images |
| **Client Init** | Basic | `createClient(SUPABASE_URL, SUPABASE_KEY)` |
| **RLS Policies** | Not configured | No Row-Level Security policies defined |
| **Database Functions** | Not used | All logic in Node.js application layer |
| **Triggers** | Not used | No database triggers |
| **Edge Functions** | Not used | - |
| **Auth** | Not used | Custom JWT auth implemented instead |

### Storage Operations

```javascript
// Upload file to Supabase Storage
const { error } = await supabase.storage
  .from("uploads")
  .upload(filename, fileBuffer, {
    contentType: mimetype,
    upsert: false
  });

// Get public URL
const { data } = supabase.storage.from("uploads").getPublicUrl(filename);

// Delete file
await supabase.storage.from("uploads").remove([storagePath]);
```

### File Path Convention

```
products/{userId}/{timestamp}-{random}.{ext}

Example: products/10/1708843200000-483921.jpg
```

---

## Error Handling

### Error Architecture

```
                    ┌─────────────┐
                    │  AppError   │  Custom operational error class
                    │ (statusCode,│  isOperational = true
                    │  message)   │
                    └──────┬──────┘
                           |
                    ┌──────┴──────┐
                    │ catchAsync  │  Wraps all async controllers
                    │ wrapper     │  Auto-catches rejected promises
                    └──────┬──────┘
                           |
                    ┌──────┴──────┐
                    │errorHandler │  Global Express error middleware
                    │ middleware  │  Formats response by environment
                    └─────────────┘
```

### Error Response Format

```json
// All errors follow this format:
{
  "success": false,
  "error": "Human-readable error message"
}

// Production: Generic message for non-operational errors
// Development: Full error message with details
```

### HTTP Status Codes Used

| Code | Usage |
|---|---|
| `200` | Successful requests |
| `201` | Resource created (signup, product, order, review, address) |
| `400` | Validation errors, business logic violations |
| `401` | Missing/invalid/expired token |
| `403` | Insufficient permissions (wrong role, not owner) |
| `404` | Resource not found |
| `409` | Conflict (duplicate phone on signup) |
| `413` | File too large (>5MB) |
| `429` | Rate limit exceeded |
| `500` | Unexpected server errors |
| `503` | Service unavailable (health checks) |

### Multer Error Handling

```javascript
// File upload errors caught specifically:
if (err instanceof multer.MulterError) {
  if (err.code === "LIMIT_FILE_SIZE") {
    // -> 413 "File too large. Maximum size is 5MB."
  }
}
if (err.message.includes("Only image files")) {
  // -> 400 "Only image files (jpg, png, webp, gif) are allowed."
}
```

### Database Error Handling

```javascript
// Transient errors (auto-recovery):
const transientCodes = ["ECONNRESET", "ETIMEDOUT", "EPIPE", "ECONNREFUSED", "57P01", "57P03"];
// Only non-transient errors logged

// Transaction pattern: always ROLLBACK on error, always release client
try {
  await client.query("BEGIN");
  // ...
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  client.release();
}
```

---

## Cybersecurity Implementation

### Security Layers

```
                         Internet
                            |
                     ┌──────┴──────┐
            Layer 1: │  Rate Limit  │  20 req/15min (auth), 100 req/15min (API)
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 2: │   Helmet    │  CSP, X-Frame-Options, X-Content-Type,
                     │   Headers   │  HSTS, XSS-Protection
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 3: │    CORS     │  Origin restricted in production
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 4: │  Body Parse │  1MB payload limit
                     │   Limits    │
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 5: │ JWT Auth    │  Bearer token verification
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 6: │  RBAC       │  Role-based access (farmer/customer)
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 7: │  Zod        │  Input validation & sanitization
                     │ Validation  │
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 8: │ Parameterized│ SQL injection prevention
                     │  Queries    │
                     └──────┬──────┘
                            |
                     ┌──────┴──────┐
            Layer 9: │ Transaction │  FOR UPDATE locks, atomic operations
                     │   Locks     │
                     └─────────────┘
```

### 1. Authentication Security

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt with 10 salt rounds |
| Token expiry | Access: 15 min, Refresh: 7 days |
| Token rotation | New pair on refresh, old token blacklisted |
| Token blacklisting | Redis-based, 7-day TTL |
| Separate secrets | JWT_SECRET and JWT_REFRESH_SECRET are different |
| Generic error messages | "Invalid phone or password" (prevents enumeration) |

### 2. Authorization Security

| Measure | Implementation |
|---|---|
| Role enforcement | `requireRole("farmer"/"customer")` middleware |
| Ownership verification | All update/delete verify resource ownership at service layer |
| Self-purchase prevention | Cannot add own products to cart or order them |
| Order access control | Only order participants can view/modify |
| Chat access control | Only order participants can join chat room |

### 3. Input Validation & Sanitization

| Measure | Implementation |
|---|---|
| Schema validation | Zod schemas on every endpoint (body, query, params) |
| String trimming | `.trim()` on all string inputs |
| Length limits | Max lengths enforced (username: 50, address: 500, etc.) |
| Numeric bounds | Price: 0-20000, Quantity: 0-2000, Rating: 1-5 |
| Phone format | Regex `/^\d{10}$/` |
| Enum validation | Role, order status restricted to valid values |
| File type check | MIME type whitelist (jpeg, png, webp, gif) |
| File size limit | 5MB maximum |

### 4. SQL Injection Prevention

```
All database queries use parameterized placeholders ($1, $2, $3...)
No string concatenation in any SQL query
pg library handles escaping automatically
```

### 5. HTTP Security Headers (Helmet)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security (HSTS)
Content-Security-Policy (CSP):
  - defaultSrc: 'self'
  - scriptSrc: 'self', approved CDNs, Razorpay
  - styleSrc: 'self', approved CDNs
  - imgSrc: 'self', Supabase, Unsplash
  - connectSrc: 'self', WebSocket, Razorpay API
  - frameSrc: 'self', Razorpay checkout
```

### 6. Rate Limiting

| Endpoint Group | Limit | Window |
|---|---|---|
| Auth (login, signup, refresh, logout) | 20 requests | 15 minutes |
| API (products, cart, orders, chat, reviews, addresses, payment) | 100 requests | 15 minutes |
| Chat messages (customers) | 1 message | per hour per order |

### 7. Payment Security (Razorpay)

| Measure | Implementation |
|---|---|
| Signature verification | HMAC-SHA256 on payment response |
| Webhook verification | HMAC-SHA256 on webhook body |
| Server-side secret | KEY_SECRET never exposed to frontend |
| Idempotency | Duplicate order check before processing |
| Amount verification | Server calculates total, not from client |
| Status validation | Only "captured"/"authorized" accepted |
| Transaction safety | FOR UPDATE locks + atomic commit |

### 8. CORS Configuration

```javascript
// Production: restricted to specific origin
origin: process.env.BASE_URL  // e.g., "https://agriconnect-wxuf.onrender.com"

// Development: allows all origins
origin: true

// Credentials enabled for auth headers
credentials: true
```

### 9. Data Protection

| Measure | Implementation |
|---|---|
| Password storage | bcrypt hash only, never stored in plain text |
| Token storage | localStorage on frontend |
| SSL/TLS | Enabled for database and Redis connections |
| Production errors | Generic "Something went wrong" (no stack traces) |
| Payload limits | 1MB body parser limit |
| Compression | Gzip enabled to reduce data in transit |

### 10. Real-time Security (Socket.io)

| Measure | Implementation |
|---|---|
| Connection auth | JWT token required in handshake |
| Room isolation | Separate room per order |
| Access verification | Check user is order participant on every event |
| Message validation | Length check (1-300 chars), trimming |
| Rate limiting | 1 message/hour for customers |
| Status check | Chat only for pending orders |

---

## Environment Variables

```env
# Server
NODE_ENV=production|development
PORT=8080

# Database
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Redis
REDIS_URL=rediss://user:pass@host:port

# JWT Secrets
JWT_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<different-long-random-string>

# Supabase (File Storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_BUCKET=uploads

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=rzp_test_xxxx (test) | rzp_live_xxxx (production)
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# AI / ML
HF_API_URL=https://api-inference.huggingface.co/models/your-model

# Application
BASE_URL=https://your-domain.com
```

---

## Getting Started

### Prerequisites

- Node.js 20.x
- PostgreSQL database (or Supabase project)
- Redis instance
- Razorpay account (test mode available)
- Supabase project (for file storage)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AgriConnect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in all required values

# Start development server
npm run dev

# Start production server
npm start
```

### NPM Scripts

```json
{
  "start": "node --dns-result-order=ipv4first src/server.js",
  "dev": "node --watch --dns-result-order=ipv4first src/server.js",
  "build": "npm install --omit=dev"
}
```

### Server Startup Sequence

```
1. Load environment variables (dotenv)
2. Initialize Express app with middleware stack
3. Connect to PostgreSQL (pool with 3 max connections)
4. Run auto-migrations (column additions, constraints, table creation)
5. Connect to Redis (with retry strategy)
6. Attach all route modules
7. Initialize Socket.io for real-time chat
8. Start HTTP server on PORT (default 8080)
9. Register graceful shutdown handlers (SIGTERM, SIGINT)
```

### Health Check

```bash
# Check all services
curl http://localhost:8080/health/all

# Response:
{
  "success": true,
  "status": "ok",
  "services": {
    "database": { "status": "connected", "latencyMs": 12 },
    "redis": { "status": "connected" }
  }
}
```
