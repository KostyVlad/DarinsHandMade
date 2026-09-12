# Order, Payment & Reporting — Implementation Plan

**Goal:** When a customer pays, create an order, email a receipt to the customer
and an order report to the store manager, and let the manager track orders and
basic sales reports.

Maps to project book: SUC 8 (קבלת הזמנות), SUC 9 (יצירת תיק / order report),
SUC 10 (דוח הזמנות), SUC 11 (שליחת הזמנה), SUC 12 (הנפקת דוחות), goal 2.2.

## Decisions (locked)
- **Payment:** Stripe Checkout (hosted page + webhook).
- **Manager report:** Email to manager **and** orders dashboard in admin.
- **Analytics:** Basic (totals, counts, by status/date, top products).
- **Guest checkout supported:** order stores customer contact, `user` may be null.

---

## Architecture — Stripe flow

```
Checkout form ──> POST /api/orders/checkout-session
                    ├─ create Order (status: pending)
                    └─ create Stripe Checkout Session ──> return session.url
Frontend redirect ──> Stripe hosted payment page
Customer pays ──> Stripe redirects to /order-success?session_id=...
Stripe ──(webhook)──> POST /api/orders/webhook  [checkout.session.completed]
                    ├─ mark Order paid
                    ├─ email receipt to customer
                    └─ email order report to manager
```

**Why webhook:** payment is confirmed server-side by Stripe (the browser redirect
alone is not trustworthy). Emails are sent only after the webhook confirms payment.

---

## Data model — `back/models/orderModel.js`

```
Order {
  orderNumber   String   // e.g. DH-20260623-0007 (human-readable)
  user          ObjectId ref User | null     // null = guest
  customer      { name, email, phone }
  shipping      { address, city, country }
  deliveryMethod 'delivery' | 'pickup'
  items [{
    product  ObjectId ref Product | null      // null for custom bag
    name, category, image
    price    Number
    quantity Number
    custom   { size, strap, chainColor, color } | null   // Custom Studio spec
  }]
  subtotal      Number
  total         Number
  currency      String  default 'usd'
  status        'pending'|'paid'|'in_production'|'shipped'|'completed'|'cancelled'
  payment       { provider:'stripe', sessionId, paymentIntentId, paidAt }
  notes         String
  timestamps
}
```

Item fields are **snapshotted** (name/price/image copied in) so reports stay
correct even if a product is later edited or deleted.

---

## Phase 1 — Order model + Stripe checkout

**Backend**
- `npm i stripe`
- `models/orderModel.js` — schema above + order-number generator.
- `controllers/orderController.js`:
  - `createCheckoutSession` — validate cart items against DB prices (never trust
    client prices), create pending Order, create Stripe session, return url.
  - `stripeWebhook` — verify signature, on `checkout.session.completed` mark paid.
- `routes/orderRoutes.js` — `POST /checkout-session`, `POST /webhook`.
- `server.js` — mount `/api/orders`; **webhook needs `express.raw({type:'application/json'})`
  mounted BEFORE `express.json()`** (Stripe signature needs the raw body).
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`, `MANAGER_EMAIL`.

**Frontend**
- `CheckoutPage.jsx` — on "Place Order": POST cart + form to `/checkout-session`,
  then `window.location = session.url` (redirect to Stripe).
- `pages/order/OrderSuccessPage.jsx` (`/order-success`) — read `session_id`,
  show confirmation, clear cart.
- Cancel returns to `/checkout`.

**Done when:** paying with a Stripe test card creates a paid Order in the DB.

---

## Phase 2 — Emails (receipt + manager report)

In the webhook, after marking the order paid:
- **Customer receipt** → `customer.email`: order number, items, quantities,
  prices, total, delivery/pickup, ETA.
- **Manager order report** → `MANAGER_EMAIL`: full spec incl. custom-bag config
  (the תיק דוח הזמנה), shipping/pickup choice, contact.
- Reuse the existing nodemailer `mailer` (Gmail). Extract `utils/email.js` with
  `sendReceipt(order)` and `sendManagerReport(order)` + HTML templates.

**Done when:** a paid order sends both emails.

---

## Phase 3 — Manager orders dashboard

**Backend** (all `protect` + `restrictTo('manager','admin')`)
- `getAllOrders` — filters: status, date range, search; sorted newest first.
- `getOrderById` — full order detail.
- `updateOrderStatus` — move through the status machine
  (pending→in_production→shipped→completed, or cancelled).

**Frontend**
- Add an **Orders** tab to `AdminPage.jsx` (or `pages/admin/ManagerOrdersPage.jsx`):
  - list: order #, customer, total, status badge, date
  - detail drawer/page: items, custom specs, shipping, status dropdown
  - status update writes back via the API.

Status values mirror SUC-13 state machine (ממתין→בהכנה→נשלח→הושלם / בוטל).

**Done when:** manager can see all orders and change their status.

---

## Phase 4 — Basic reports / analytics

**Backend**
- `getStats` (manager) via Mongo aggregation:
  - total revenue, order count, average order value
  - revenue by status, orders over last 7/30 days
  - top products by quantity sold.

**Frontend**
- Reports section in admin: stat cards (Total Sales, Orders, Avg Order),
  top-products list, date-range filter.

**Done when:** manager sees sales totals and top products.

---

## Security & correctness
- **Never trust client prices** — recompute totals from DB products server-side.
- **Verify Stripe webhook signature** with `STRIPE_WEBHOOK_SECRET`.
- Manager/report routes are **role-gated** (`restrictTo`).
- A user can only fetch **their own** orders; managers can fetch all.
- Webhook is **idempotent** (ignore if order already `paid`).

## What you must set up (Stripe)
1. Create a Stripe account → get **test** `STRIPE_SECRET_KEY` (sk_test_...).
2. Add webhook endpoint `…/api/orders/webhook` → event `checkout.session.completed`
   → copy the **signing secret** to `STRIPE_WEBHOOK_SECRET`.
   (Local: use the Stripe CLI `stripe listen --forward-to localhost:5000/api/orders/webhook`.)
3. Set `MANAGER_EMAIL` (where order reports go) and `CLIENT_URL`.
4. Test card: `4242 4242 4242 4242`, any future date, any CVC.

## Env summary (back/.env + Render backend)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MANAGER_EMAIL=romperrol@gmail.com
CLIENT_URL=https://darinshandmade-front.onrender.com   # backend builds links/redirects
```

## Suggested build order
Phase 1 → 2 → 3 → 4. Phases 3 and 4 are independent of payment and could be
built/tested with manually-created orders if Stripe setup is delayed.
