# Darin's HandMade

E-commerce store for handmade goods (beaded bags, bracelets, embroidery), with a custom-order studio. React single-page app on the front, Express REST API on the back, MongoDB for storage.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, Framer Motion |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs`, Google OAuth (client-side) |
| Security | `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `xss-clean`, `cors` |

## Architecture

```
Browser (React SPA, port 5173)
  └─ fetch/axios → Express API (port 5000)
                      ├─ /api/auth     → authController     → MongoDB (users)
                      ├─ /api/products → productController  → MongoDB (products)
                      └─ /api/cart     → cartController     → MongoDB (carts)
```

- Single-page frontend talks to the backend over HTTP. No SSR, no BFF layer.
- Auth uses a 7-day JWT stored in `localStorage`, sent as `Authorization: Bearer <token>`.
- Cart state lives in `CartContext` (React Context API), partially synced to the DB.

## Project Structure

```
DarinsHandMade/
├── back/                        # Express API server
│   ├── config/db.js             # MongoDB connection
│   ├── controllers/             # auth, product, cart logic
│   ├── middleware/              # authMiddleware.js (JWT verification)
│   ├── models/                  # userModel, cartModel
│   ├── routes/                  # auth, product, cart routes
│   ├── seed/products.js         # DB seed script (wipes products first!)
│   ├── uploads/bags/            # static product images
│   └── server.js
│
└── front/                       # React SPA
    ├── src/
    │   ├── context/CartContext.jsx   # cart state + API calls
    │   ├── pages/                    # home, about, cart, login,
    │   │                             #   beaded-bags, bracelets,
    │   │                             #   custom-studio, embroidery
    │   ├── shared/
    │   │   ├── constants/routes.js   # route path constants
    │   │   └── ui/                    # Header, Footer
    │   ├── App.jsx                    # router setup
    │   └── main.jsx
    ├── vite.config.js
    └── eslint.config.js
```

## Getting Started

### Prerequisites

- Node.js
- A MongoDB instance (local or Atlas)

### 1. Backend

```bash
cd back
npm install
```

Create `back/.env`:

```env
MONGO_URI=mongodb://localhost:27017/darins-handmade
JWT_SECRET=your-secret-here
PORT=5000
```

Run it:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

Optionally seed sample products (⚠ deletes all existing products first):

```bash
node seed/products.js
```

### 2. Frontend

```bash
cd front
npm install
npm run dev      # Vite dev server
```

Other frontend scripts: `npm run build`, `npm run preview`, `npm run lint`.

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | No | Register with email/password |
| POST | `/api/auth/login` | No | Log in, returns JWT |
| POST | `/api/auth/google` | No | Google sign-in |
| GET | `/api/products` | No | List products |
| GET | `/api/products/:id` | No | Get one product |
| POST | `/api/products` | No ⚠ | Create product |
| DELETE | `/api/products/:id` | No ⚠ | Delete product |
| GET | `/api/cart` | Yes | Get current user's cart |
| POST | `/api/cart` | Yes | Add item to cart |
| DELETE | `/api/cart/:itemId` | Yes | Remove cart item |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing/verification secret |
| `PORT` | API server port (default `5000`) |

> The frontend currently uses a hardcoded `http://localhost:5000` API URL. Moving this to a `VITE_API_URL` env var is needed before deployment.

## Status & Known Gaps

This is an in-progress project. Notable open items (see [.planning/codebase/CONCERNS.md](.planning/codebase/CONCERNS.md) for the full audit):

**Security (priority):**
- `POST`/`DELETE /api/products` have **no auth guard** — anyone can create/delete products.
- `/api/auth/google` trusts client-supplied identity with no server-side token verification.
- No input validation on signup/cart endpoints; no rate limit on login/signup.

**Incomplete features:**
- Custom Studio page — placeholder only.
- Product detail page — backend endpoint exists, no frontend page.
- Checkout / order flow — not started (no Order model, no payment integration).
- Privacy Policy / Terms pages — linked in footer, no route.

**Other:**
- `updateQuantity` in the cart updates local state only (lost on refresh).
- No automated tests (0% coverage).
- Seed script has no production guard.

## Documentation

A detailed codebase analysis lives in [.planning/codebase/](.planning/codebase/):

- [ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) — system design, API, auth & cart flows
- [STACK.md](.planning/codebase/STACK.md) — full dependency breakdown
- [STRUCTURE.md](.planning/codebase/STRUCTURE.md) — directory layout & naming conventions
- [CONVENTIONS.md](.planning/codebase/CONVENTIONS.md) — code style & patterns
- [INTEGRATIONS.md](.planning/codebase/INTEGRATIONS.md) — external services & env vars
- [TESTING.md](.planning/codebase/TESTING.md) — test coverage & recommendations
- [CONCERNS.md](.planning/codebase/CONCERNS.md) — security issues & technical debt
