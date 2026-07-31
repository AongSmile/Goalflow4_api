# GoldFlowin API v2

REST API for GoldFlowin Instrument Co., Ltd. — built with Express + Prisma (Postgres), matching
the endpoints expected by the `Goldflowin-web-main` frontend (`src/api/*.jsx`).

## Stack
- Node.js + Express 5
- Prisma ORM 7 (PostgreSQL via `@prisma/adapter-pg` — designed for Supabase)
- JWT auth (`jsonwebtoken`) + `bcryptjs` for password hashing
- Cloudinary for image uploads
- Stripe for payments

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values (Supabase DATABASE_URL/DIRECT_URL, Cloudinary, Stripe, SECRET)

# Push the schema to Supabase (creates/updates all tables)
npx prisma db push
# or, if you want a tracked migration history instead of db push:
# npx prisma migrate dev --name init

# Load the 88 products migrated from the old GoalFlows catalog
# (client/public/mock-api/products.json + categories.json, copied into
# prisma/seed-data/) — safe to re-run, upserts by slug
npx prisma db seed

npm run dev             # nodemon, http://localhost:5001
```

The `client/` app (see its own README/CLAUDE.md) points at this API via
`VITE_API_BASE_URL` in its `.env` — defaults to `http://localhost:5001/api`
for local dev, so the two just work together once both are running.

### Catalog fields added on top of the reference schema

The original schema only had generic e-commerce fields (`title`,
`description`, `price`, `quantity`, `category`, `brand`, `images`). To fully
carry over the 88-product instrument catalog migrated from the old site, the
following were added:

- `Product`: `slug` (unique, used for the public detail-page URL), `subtitle`,
  `lineUrl`, `specPdf`, `features String[]`, `applications String[]`,
  `thumbnail`, `mainImage`, `logoImage`, `specImage`, `deliveryImage`,
  `subcategoryId`. `price`/`quantity` are now optional with a default of 0,
  since instrument products aren't all sold through the cart/checkout flow.
- `Category`: `slug`, `title`, `subtitle`, plus a `subcategories` relation.
- New `Subcategory` model: second-level grouping used only by the `products`
  (e.g. "Hardness Tester Machine") and `small-tools` (brand pages) top-level
  categories — the three balance categories (`industrial-balance`,
  `animal-balance`, `hospital-balance`) list products directly with no
  subcategory.

### New endpoints on top of the table above

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/products?category=&subcategory=` | – | storefront catalog listing, filtered by slug |
| GET | `/api/product/slug/:slug` | – | storefront detail page lookup |
| GET | `/api/category-meta/:category/:subcategory?` | – | listing-page heading (title/subtitle) |
| GET | `/api/subcategory?category=` | – | list subcategories, optionally filtered |
| POST | `/api/subcategory` | admin | |
| DELETE | `/api/subcategory/:id` | admin | |

Note the migrated products' image/PDF URLs (e.g. `/product-media/...png`)
are relative paths served by the `client/public/product-media/` folder, not
Cloudinary — they were never re-uploaded. New products created via the admin
dashboard *do* go through Cloudinary (`/api/images`).

## Prisma 7 (this project is on `prisma@7.9.0` / `@prisma/client@7.9.0`)

Prisma 7 changed how the DB connection is configured, and requires a
"driver adapter" for direct (non-Accelerate) Postgres connections. This
project follows that architecture:

- **`prisma/schema.prisma`** — the `datasource` block now only has
  `provider = "postgresql"`. It no longer holds a connection URL (Prisma 7
  removed `url`/`directUrl` from schema files entirely).
- **`prisma.config.mjs`** (repo root) — holds the connection URL the
  **Prisma CLI** uses for `db push` / `migrate` / `studio` / `db seed`. It
  points at `DIRECT_URL` (Supabase's non-pooled connection - required for
  schema changes). This file is `.mjs` on purpose: the rest of the project
  is ESM too (see below), but naming it explicitly `.mjs` means the Prisma
  CLI can load it with zero ambiguity.
- **`config/prisma.js`** — holds the connection the **running app** uses at
  runtime, via `@prisma/adapter-pg` (`node-postgres` driver adapter),
  pointed at `DATABASE_URL` (Supabase's pooled/pgbouncer connection - what
  you want for a live server handling many requests).
- **The whole project is now ESM** (`"type": "module"` in `package.json`,
  `import`/`export` everywhere instead of `require`/`module.exports`) —
  Prisma 7's driver-adapter packages (`@prisma/adapter-pg`, etc.) are
  ESM-only, so this was necessary, not optional. If you add a new
  controller/route file, use `import`/`export` and give every relative
  import an explicit `.js` extension (Node ESM requires this, unlike
  CommonJS) - e.g. `import prisma from '../config/prisma.js'`.

If you ever see `PrismaClientConstructorValidationError: ... requires
either "adapter" or "accelerateUrl"`, it means somewhere `new
PrismaClient()` was called without the adapter — check `config/prisma.js`
is what's actually being imported (there's exactly one call to
`new PrismaClient(...)` in this project, and it always passes `{ adapter }`).

SSL note: Supabase requires SSL, and `config/prisma.js` passes
`ssl: { rejectUnauthorized: false }` to the adapter to work around
Supabase's certificate chain not validating with `pg`'s defaults under
Prisma 7's node-postgres-based engine. If you get `P1010: User was denied
access` or a self-signed-certificate error, that's the setting to look at.

## Auth: password hashing, JWT, and Google Sign-In

- **Passwords** are hashed with `bcryptjs` at cost factor 12 (`controllers/auth.js`).
  Registration requires at least 8 characters with a letter and a number
  (enforced server-side; the client mirrors the same rule so users get
  instant feedback, but the server is the source of truth).
- **JWTs** are signed with `SECRET` (HS256, via `jsonwebtoken`) and expire
  after 7 days. `authCheck` middleware verifies the signature + expiry and
  re-checks the user is still `enabled` in the DB on every request (so
  disabling a user immediately revokes access, without needing token
  revocation/blacklisting).
- **Google Sign-In** (`/api/google-login`): the client gets an ID token from
  Google (via `@react-oauth/google`'s `<GoogleLogin/>`) and sends *only that
  token* to the server - never a password. The server verifies the token's
  signature and audience against Google's public keys using
  `google-auth-library` before trusting any of its contents (email, name,
  picture). A first-time Google sign-in creates a `User` row with no
  `password` set; that account can only ever sign in via Google (attempting
  a normal `/login` with that email returns a clear "signed up with Google"
  message instead of a confusing password error).

**Setup:** create an OAuth 2.0 Client ID at
https://console.cloud.google.com/apis/credentials (Application type: "Web
application"). Add `http://localhost:5173` (client dev server) and your
real deployed domain under "Authorized JavaScript origins". Put the same
Client ID in **both**:
- `server/.env` → `GOOGLE_CLIENT_ID`
- `client/.env` → `VITE_GOOGLE_CLIENT_ID`

They must match exactly - the server checks the token's `audience` against
its own `GOOGLE_CLIENT_ID` and rejects anything else.

## Phase 1 — Dynamic Category/Subcategory/Brand/Article + Role & Permission system

This section documents the CMS spec's Phase 1 (database + backend API).
Phases 2 (admin UI: edit forms, status toggles, a proper permission-picker
screen) and 3 (public frontend: dynamic Navbar, brand strip, article
section) come next; Phase 4 (TypeScript + Clean Architecture rewrite) is
deliberately last, once everything else is stable.

### What's new in the schema

- **`Category`** / **`Subcategory`** gained a `status Boolean` (enable/disable
  without deleting - hidden from `/api/navbar` and the storefront when
  `false`).
- **`Brand`** gained `logoUrl`, `url`, `sortOrder` (lower = shown first),
  and `status`.
- **`Article`** gained `excerpt` (short blurb for listing cards, separate
  from the full `description`), `status`, and `publishedAt` (what
  "เรียงจากวันที่ล่าสุด" sorts by - defaults to creation time but can be
  changed independently, e.g. to schedule/backdate).
- New **`Role`** and **`Permission`** models (`User.roleId` → `Role`,
  `Role.permissions` ↔ `Permission` many-to-many) - this is the
  "ปรับแต่งได้ผ่านหน้า Admin" permission system. See below.

Run `npx prisma db push` then `npx prisma db seed` after pulling this - the
seed now also loads the fixed `Permission` catalog and creates a ready-to-use
**"Staff"** `Role` matching the spec's example exactly (product + article
create/edit, nothing else).

### How the permission system works

`User.role` stays a plain string (`"user"` | `"staff"` | `"admin"`) for
backward-compatible coarse checks - `adminCheck` middleware is unchanged and
still just checks `role === "admin"`. What's new is for `role === "staff"`:
`User.roleId` points at a `Role` row, and that `Role` grants a subset of a
**fixed** list of permission keys (`config/permissions.js` - e.g.
`product.create`, `article.edit`, `category.manage`). Admins create/edit
`Role`s and pick which keys each one grants via `/api/roles` (a future admin
screen builds on this - Phase 2); a `User`'s `roleId` decides which `Role`
they've been assigned via `POST /api/change-role`.

`middlewares/authCheck.js`'s `authCheck` now also loads the caller's
`roleRef.permissions` and attaches the resolved keys as
`req.user.permissions` (plus `req.user.dbRole`), so `permissionCheck(key)`
(new export from the same file) can check `req.user.permissions.includes(key)`
without another DB query. Use it like:

```js
router.post('/product', authCheck, permissionCheck('product.create'), create)
```

**Deletion is always `adminCheck`, never `permissionCheck`** - the spec is
explicit that Staff can never delete anything no matter what else they're
granted, so every `DELETE` route uses the hard admin-only check, full stop.
(`*.delete` keys still exist in the permission catalog for completeness/
future flexibility, but nothing checks them today - loosening this would be
a deliberate code change, not an admin-UI setting.)

### API restructure: plural REST paths + pagination/search/status

Per the spec's section 7, Category/Subcategory/Brand/Article moved to
plural, full-CRUD paths (`GET/POST /categories`, `PUT/DELETE
/categories/:id`, etc. - see the Endpoints table below). List endpoints all
accept:

```
?page=1&limit=20&search=keyword&status=true|false
```//→ response shape: `{ items: [...], meta: { total, page, limit, totalPages } }`

(`status` omitted = no filter, returns both enabled and disabled rows - only
the admin list views work this way; the public storefront endpoints below
are hardcoded to `status: true` and don't take a status param at all.)

**The old singular paths (`/category`, `/subcategory`, `/brand`, `/article`)
were removed, not aliased** - `client/src/api/adminApi.js` was updated in
the same pass to call the new plural paths and unwrap `.items`, so the
existing admin pages (Category/Subcategory/Brand/Article) keep working
exactly as before with zero UI changes. `Product` was left alone (`/product`
singular) since the spec didn't ask to rename it and nothing there needed
pagination changes yet.

### New public endpoints (no auth) for the dynamic frontend (Phase 3 will consume these)

- `GET /api/navbar` - every enabled `Category` with its enabled
  `Subcategory[]`, in display order. This is *the* thing that makes the
  Navbar dynamic (spec section 2) - the frontend renders this response
  directly, no hardcoded menu.
- `GET /api/brands/storefront` - enabled brands, sorted by `sortOrder`.
- `GET /api/articles/storefront?page=&limit=` - enabled articles, sorted by
  `publishedAt` desc, paginated (default 6/page) - for the "เกี่ยวกับโกลโฟล"
  page's "ข่าวสาร/บทความน่ารู้" section.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/register` | – | now also returns `{ payload, token }` (logs you straight in); requires an 8+ char password with a letter and a number |
| POST | `/api/login` | – | |
| POST | `/api/google-login` | – | `{ credential }` = the ID token from the client's `<GoogleLogin/>`; verified server-side against Google before trusting the email. Creates the `User` row on first sign-in (no password set) |
| POST | `/api/current-user` | user | |
| POST | `/api/current-admin` | admin | |
| GET | `/api/navbar` | – | public; enabled categories + subcategories for the dynamic Navbar |
| GET | `/api/categories` | `category.manage` | `?page=&limit=&search=&status=` |
| POST | `/api/categories` | `category.manage` | |
| PUT | `/api/categories/:id` | `category.manage` | |
| DELETE | `/api/categories/:id` | admin | |
| GET | `/api/category-meta/:category/:subcategory?` | – | public; storefront listing-page heading |
| GET | `/api/subcategories` | `category.manage` | `?category=&page=&limit=&search=&status=` |
| POST | `/api/subcategories` | `category.manage` | |
| PUT | `/api/subcategories/:id` | `category.manage` | also how you "ย้ายไปยังหมวดหมู่หลักอื่น" - just send a new `categoryId` |
| DELETE | `/api/subcategories/:id` | admin | |
| GET | `/api/brands/storefront` | – | public; enabled brands sorted by `sortOrder` |
| GET | `/api/brands` | `brand.manage` | `?page=&limit=&search=&status=` |
| POST | `/api/brands` | `brand.manage` | `{ name, logoUrl, url, sortOrder, status }` |
| PUT | `/api/brands/:id` | `brand.manage` | |
| DELETE | `/api/brands/:id` | admin | |
| GET | `/api/products/:count` | – | legacy "latest N" |
| GET | `/api/products` | – | `?category=&subcategory=` storefront catalog |
| GET | `/api/product/:id` | `product.view` | numeric id, admin/staff lookup |
| GET | `/api/product/slug/:slug` | – | public storefront detail page |
| POST | `/api/product` | `product.create` | |
| PUT | `/api/product/:id` | `product.edit` | |
| DELETE | `/api/product/:id` | admin | |
| POST | `/api/productby` | – | sort/order/limit |
| POST | `/api/search/filters` | – | query / category / price |
| POST | `/api/images` | `product.create` | Cloudinary upload |
| POST | `/api/removeimages` | `product.edit` | Cloudinary destroy |
| GET | `/api/articles/storefront` | – | public; `?page=&limit=` (default 6), enabled only |
| GET | `/api/articles` | `article.view` | `?page=&limit=&search=&status=` |
| POST | `/api/articles` | `article.create` | `{ name, excerpt, description, status, images }` |
| PUT | `/api/articles/:id` | `article.edit` | |
| DELETE | `/api/articles/:id` | admin | |
| POST | `/api/article/images` | `article.create` | Cloudinary upload |
| POST | `/api/article/removeimages` | `article.edit` | Cloudinary destroy |
| GET | `/api/permissions` | admin | fixed permission catalog, for building the Role editor UI |
| GET | `/api/roles` | admin | includes each Role's permissions + user count |
| POST | `/api/roles` | admin | `{ name, description, permissionKeys[] }` |
| PUT | `/api/roles/:id` | admin | `permissionKeys` (if sent) replaces the whole set |
| DELETE | `/api/roles/:id` | admin | clears `roleId` on any Users assigned to it first |
| GET | `/api/users` | admin | includes `roleRef` |
| POST | `/api/change-status` | admin | enable/disable user |
| POST | `/api/change-role` | admin | `{ id, role, roleId? }` - `roleId` only applies/matters when `role === "staff"` |
| GET | `/api/admin/orders` | admin | |
| PUT | `/api/admin/order-status` | admin | |
| POST | `/api/user/cart` | user | |
| GET | `/api/user/cart` | user | |
| DELETE | `/api/user/cart` | user | |
| POST | `/api/user/address` | user | |
| POST | `/api/user/order` | user | |
| GET | `/api/user/order` | user | |
| POST | `/api/user/create-payment-intent` | user | Stripe |

## What's different from the reference API (`Goldflowin-api-main`), and why

1. **`/api/product/:id` (PUT/DELETE) and `/api/article` (POST/DELETE) are now
   protected** with `authCheck` + `adminCheck`. In the reference API these
   were wide open — anyone could edit or delete any product with no login at
   all. The frontend already sends a token on these calls, so nothing needs
   to change there.
2. **`/api/change-role` now actually changes the role.** In the reference
   API both `/change-status` and `/change-role` were wired to the same
   `changeStatus` controller, so role changes silently did nothing.
3. **`/api/admin/orders` and `/api/admin/order-status` now require
   `adminCheck`**, not just a valid login.
4. **Stripe payment intent amount is computed from the user's actual cart
   total** instead of a hardcoded 5000 satang. The Stripe secret key is read
   from `STRIPE_SECRET_KEY` in `.env` — the reference API had a live-looking
   key hardcoded directly in the source, which should never be committed to
   a repo.
5. **Fixed a few bugs that would crash at runtime**: `stripe.paymentIntent`
   → `stripe.paymentIntents`, `prisma.Article` → `prisma.article`,
   `emptyCart` referencing an undefined `cart` variable, and a typo'd
   variable in `saveOrder`'s product-quantity update.
6. **Cloudinary config is centralized** in `config/cloudinary.js` instead of
   being repeated in every controller that uploads images.
7. **A single shared Prisma client** (`config/prisma.js`) is reused across
   hot reloads in dev to avoid exhausting the connection pool — useful on
   serverless (Vercel) deploys.
8. **`brandId` is now actually accepted** on product create/update (the
   `Brand` model existed in the reference schema but was never wired into
   the product controller). The current frontend form doesn't send a
   `brandId` yet, so this is inactive until that's added — but it's ready.

## Deploying to Vercel

This project is structured the same way as the reference API, so the same
`vercel.json` approach works — add a `postinstall` step (`prisma generate`,
already in `package.json`) and set all the `.env.example` variables in the
Vercel project settings.

## Phase 2 — Admin UI (edit forms, status toggles, Role/Permission screen)

Builds on Phase 1 above - no schema or route changes here, just one small
controller addition and a large client-side pass. See
`client/CLAUDE.md`'s "Phase 2" section for the full client-side detail;
this is just the one backend change:

- **`controllers/auth.js`'s `currentUser`** now also returns `roleId`,
  `roleName`, and a flattened `permissions: string[]` (resolved from
  `roleRef.permissions`), so the client can build a permission-aware
  sidebar/route-guards without a second, bespoke endpoint. Called via
  `POST /api/current-user` (any authenticated user) - same auth as before,
  just a richer response.

## Phase 3 — Public frontend (dynamic Navbar, Brand strip, Article section)

One small addition on top of Phase 1's public endpoints:

- **`GET /api/articles/storefront/:id`** (new) - the "อ่านเพิ่มเติม" (read
  more) target for a single article. Public, but - like `storefront` above -
  only ever returns the article if `status: true`; a disabled article 404s
  even with a direct link to its id.

Everything else (`/api/navbar`, `/api/brands/storefront`,
`/api/articles/storefront`) already existed from Phase 1 - Phase 3 was
purely the client consuming them. See `client/CLAUDE.md`'s "Phase 3"
section for the full detail.

## Phase 4 — TypeScript (strict) + Clean Architecture rewrite

**This supersedes every file path mentioned in the Phase 1-3 sections above**
(e.g. `controllers/auth.js`, `config/prisma.js`, `middlewares/authCheck.js`) -
those sections are left as-is as a historical record of *what changed and
why* at each phase, but the actual files now live under `src/` with `.ts`
extensions and a layered structure. This section is the map from old to new.

### ⚠️ Not compile-checked

This rewrite was done in a sandbox with no internet access and no
`typescript`/`tsc` installed, and no way to install them. Every file was
written carefully and manually re-reviewed (checking every Prisma
model/field name against `schema.prisma`, tracing every relative import,
double-checking type narrowing in a few tricky spots), but **none of it has
actually been compiled**. Before deploying or relying on this:

```bash
npm install
npx tsc --noEmit    # or: npm run typecheck
```

and fix whatever that surfaces. Given the size of this change (~60 new
files), some rough edges are likely even after careful review - please
open the file and read the surrounding comment before "fixing" something
that looks odd; a lot of the type-level compromises (see `product.service.ts`'s
`listBy`, `role.service.ts`'s `permissions: { set: ... }`, etc.) are
deliberate, not fashion.

### Folder structure

```
src/
  server.ts              - entry point (just calls createApp() and .listen())
  app.ts                 - Express app setup (middleware, mounts routes/index.ts, error handler)
  routes/index.ts         - explicitly imports + mounts every module's router
  types/
    express.d.ts          - augments Express's Request with `user?: AuthUser`
  config/
    prisma.ts             - the one PrismaClient instance (driver adapter, see Phase 3 section)
    cloudinary.ts
    googleClient.ts
    permissions.ts         - fixed permission key catalog (unchanged from Phase 1, just typed)
  shared/
    errors/AppError.ts     - the one error class every service throws
    middlewares/
      authCheck.ts          - authCheck / adminCheck / permissionCheck
      errorHandler.ts       - the one place that turns errors into HTTP responses
    utils/queryHelpers.ts   - pagination/search/status-filter parsing
  modules/
    <name>/
      <name>.routes.ts      - Express Router, wires middleware + controller methods to paths
      <name>.controller.ts  - HTTP in/out only: parses req, calls service, sends res
      <name>.service.ts     - business logic; the ONLY layer allowed to throw AppError
      <name>.repository.ts  - Prisma calls ONLY; no business rules, no req/res, no throwing AppError
      <name>.types.ts        - DTOs (what the client sends) - not present for every module
                               (admin/user/stripe/role have simple enough shapes to skip a
                               separate repository.types split in some cases - see each folder)
```

One folder per resource: `auth`, `product`, `category`, `subcategory`,
`brand`, `article`, `role`, `admin` (orders admin view + user
administration), `user` (cart/address/order, the customer-facing side),
`stripe`.

### Why this layering, specifically

- **Repository** never imports Express types and never throws `AppError` -
  it's pure data access, swappable/testable independent of HTTP concerns.
  It DOES know about Prisma (this isn't "ports and adapters" with a fully
  abstract data interface - that felt like overkill for a Prisma-only
  project; the boundary that matters here is "business rules vs. raw
  queries", not "swap Prisma for something else").
- **Service** has all the business rules (validation, what counts as "not
  found", password hashing, the Google token verification, the order
  transaction) and is the only layer that throws `AppError`. It never
  touches `req`/`res`.
- **Controller** is deliberately thin and has **no try/catch anywhere** -
  Express 5 automatically forwards a rejected promise from an async route
  handler to `next(err)`, which lands in `shared/middlewares/errorHandler.ts`
  exactly once. This is a real reduction from the JS version, where every
  single handler had its own try/catch/`res.status(500)` block.
- **Routes** files are the only place middleware (`authCheck`,
  `permissionCheck`, `adminCheck`) gets attached - controllers and services
  have no awareness of auth at all beyond receiving `req.user` (typed via
  `types/express.d.ts`) or being passed a plain `userId: number`.

### The transaction fix (spec section 10: "ใช้ Transaction เมื่อมีการบันทึกหลายตาราง")

This was a genuine bug fix, not just restructuring. The old
`controllers/user.js`'s order-save flow did, as separate un-transacted
calls: create the `Order`, then decrement every purchased `Product`'s
stock (+ increment `sold`), then clear the `Cart` - if the process died
between any of these steps, you could end up with an `Order` that never
deducted stock (oversell risk) or deducted stock with no `Order` to show
for it. `modules/user/user.service.ts`'s `saveOrder` now wraps all of that
in one `prisma.$transaction(...)` (via `userRepository.runInTransaction`).
The cart-replace flow (`userCart`) got the same treatment for the same
reason, at lower stakes (worst case there was just an emptied cart, not a
financial/inventory inconsistency).

`modules/user/user.repository.ts` shows the pattern used everywhere a
transaction is needed: every method takes an optional `db` parameter
(`Prisma.TransactionClient | typeof prisma`, defaulting to the singleton
client) so the service can pass a transaction handle through when
composing several repository calls atomically, without every other module
needing to know transactions exist.

### Build & run

```bash
npm install
npm run typecheck   # tsc --noEmit - do this first, see the warning above
npm run dev          # tsx watch src/server.ts - no build step needed for dev
npm run build         # tsc -> dist/
npm start              # node dist/server.js - what you'd run in production
```

`prisma/seed.ts` is run via `tsx` directly (see `prisma.config.mjs`'s
`migrations.seed`), not through the main build - it's a one-off dev script,
not part of the deployed server.

### What did NOT change

The Prisma schema, the API surface (every route/path/permission-key from
Phases 1-3), the seeded default "Staff" Role, and the client (`../client`)
are all untouched by this phase - this was purely an internal
implementation restructure. If you were testing against this API before,
every request/response shape is identical.
