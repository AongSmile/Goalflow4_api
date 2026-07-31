# Deploying the server (GitHub → Vercel)

This covers pushing `server/` to GitHub and deploying it to Vercel as a
serverless function. Read `README.md` first if you haven't already - this
assumes the app already runs locally (`npm run dev`, `npm run build`,
`npm run typecheck` all passing).

## 1. Push to GitHub

If `client/` and `server/` are two folders inside **one** repo (recommended -
simpler to keep in sync, Vercel supports deploying a subfolder via "Root
Directory", see step 2):

```bash
# from the repo root, one level above client/ and server/
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

If you'd rather keep them as two separate repos, run the same steps
separately inside `client/` and inside `server/`.

Either way, double-check `.gitignore` in `server/` already excludes what it
should before committing:

```
node_modules
.env
generated/
dist/
```

**Never commit your real `.env`** - only `.env.example` should be tracked.
Copy `.env.example` to `.env` locally (already done if you've been running
this) and keep the real one out of git.

## 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo
   you just pushed.
2. **Root Directory**: if `client/`/`server/` are both in one repo, set this
   to `server` (click "Edit" next to Root Directory in the import screen).
   If it's its own repo, leave this as the repo root.
3. **Framework Preset**: choose "Other" (this isn't Next.js/a static site -
   it's a plain Node API deployed as a serverless function via
   `api/index.ts` + `vercel.json`, both already in this project).
4. **Build Command / Output Directory**: leave blank/default. Vercel's
   Node builder picks up `api/index.ts` automatically because it's under
   `/api`; `vercel.json`'s rewrite sends every request there. You do NOT
   need `npm run build` to run for this - Vercel's `@vercel/node` builder
   compiles `api/index.ts` (and everything it imports from `src/`) itself.
5. **Environment Variables** - add every key from `.env.example`:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Supabase pooled connection string |
   | `DIRECT_URL` | Supabase direct connection string |
   | `SECRET` | your JWT secret |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
   | `STRIPE_SECRET_KEY` | from Stripe dashboard |
   | `GOOGLE_CLIENT_ID` | must match the client's `VITE_GOOGLE_CLIENT_ID` exactly |

   `PORT` is **not needed** - Vercel's serverless runtime doesn't use
   `app.listen()` at all (see `api/index.ts`).

6. Click **Deploy**.

`postinstall: prisma generate` runs automatically during Vercel's
`npm install` step, so the Prisma Client gets generated for you - you don't
need to do anything extra for that.

## 3. After the first deploy

- Your API is now live at `https://<project-name>.vercel.app` (everything
  under `/api/...` - e.g. `https://<project-name>.vercel.app/api/products`).
  Copy this URL.
- Go back to the **client** project's Vercel settings (see
  `client/DEPLOYMENT.md`) and set `VITE_API_BASE_URL` to
  `https://<project-name>.vercel.app/api`, then redeploy the client so it
  points at the real backend instead of `localhost:5001`.
- Run `npx prisma db push` and `npx prisma db seed` **from your own machine**
  (pointed at the same `DATABASE_URL`/`DIRECT_URL` you gave Vercel) at least
  once, if you haven't already - Vercel's build step does not run migrations
  or seed data for you.

## Making it feel as close to "always-on" as possible

If you want to stay on Vercel but minimize the serverless rough edges
(cold starts especially), do these in order of impact:

### 1. Match the function region to your Supabase region (biggest win)

Network round-trip time between Vercel's function and your database
usually matters more than cold-start time itself. `vercel.json` already
pins this project to `"regions": ["hnd1"]` (Tokyo) - **check this actually
matches your Supabase project's region** (Supabase dashboard → Project
Settings → General → Region) and change it if not. Common matches:

| Supabase region | Vercel region code |
|---|---|
| Northeast Asia (Tokyo) | `hnd1` |
| Southeast Asia (Singapore) | `sin1` |
| US East | `iad1` |
| US West | `sfo1` |
| Europe (Frankfurt) | `fra1` |

(Full list: `vercel regions ls` via the Vercel CLI, or their docs.)

### 2. Enable Fluid Compute (Vercel project setting)

Project → Settings → Functions → look for **Fluid Compute**. This is
Vercel's newer execution model that keeps instances warm and reuses them
across concurrent requests much more aggressively than the classic
per-invocation serverless model - it's the single biggest lever for
"feels less cold-start-y" without changing any code. Available on
Pro/Enterprise; worth turning on if you have it.

### 3. Warm the function with a Cron Job (cheap trick, works on any plan)

Vercel Cron Jobs can hit an endpoint on a schedule. Pinging your own API
every 5 minutes keeps at least one instance warm during low-traffic
periods, so real users are less likely to hit a cold start. Add to
`vercel.json`:

```json
{
  "crons": [{ "path": "/api/products/1", "schedule": "*/5 * * * *" }]
}
```

(Hobby plan allows cron jobs but limits how often they can run and how
many you can have - check current limits on your plan; adjust the path to
any cheap, side-effect-free `GET` endpoint.)

### 4. Bigger function memory (Pro plan)

Vercel scales CPU allocation with memory - bumping a function's memory in
Project Settings → Functions gives it more CPU too, which shortens both
cold-start time and actual request handling time. Diminishing returns
past 1-2GB for an API this size, but worth trying if things still feel
sluggish after 1-3 above.

None of this makes Vercel *identical* to an always-on process - there will
always be a first request that's slower after idle time. It gets you
meaningfully closer, at zero-to-low cost, without leaving Vercel.

## ⚠️ Should you actually use Vercel for this, though?

Vercel works, and the driver-adapter approach (`@prisma/adapter-pg`,
see `README.md`'s Phase 4 section) specifically avoids Prisma's old
Rust-binary-compatibility headaches on serverless platforms, which used to
be the main pain point. But a few things are still worth knowing before you
commit to it for a real production API:

- **Cold starts**: a serverless function that hasn't been hit in a while
  takes a moment to spin up (a fresh Node process + a fresh Prisma
  connection). Usually a few hundred ms, sometimes more. Fine for an admin
  panel and low-to-medium traffic storefront; noticeable if you need
  consistently fast responses under load.
- **Function timeout**: Vercel's Hobby plan caps a single function
  execution at 10 seconds (Pro: 60s, configurable higher). A slow
  Cloudinary upload or a very large product export could theoretically hit
  this - unlikely for this app's current endpoints, but worth knowing.
- **Connection pooling**: `DATABASE_URL` (pooled, via Supabase's pgbouncer)
  is what serverless needs - many concurrent function invocations opening
  their own DB connections is exactly the scenario pgbouncer pooling exists
  for. Make sure you're using the **pooled** URL (port 6543, `?pgbouncer=true`)
  for `DATABASE_URL`, not the direct one, in Vercel's env vars.

If you outgrow this or want a simpler mental model (one long-running
process, no cold starts, no function timeout), **Render** or **Railway**
are both straightforward alternatives for a plain Express app - same
`npm run build && npm start` you already have, no `api/index.ts` /
serverless adapter needed at all. Worth keeping in mind if Vercel ever
becomes a poor fit rather than assuming you're locked in.

### If "smooth like before" is really the priority: Render in ~5 minutes

This is the honest direct answer if cold starts are the actual complaint -
Render runs your app as one continuously-running container, identical in
behavior to `npm run dev` locally, just always on:

1. [render.com](https://render.com) → New → Web Service → connect the same
   GitHub repo.
2. Root Directory: `server` (if monorepo).
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Add the same environment variables as the Vercel table above (`PORT` is
   optional - Render sets its own and Express already reads
   `process.env.PORT || 5001`).
6. Deploy. No `api/index.ts`, no `vercel.json`, no region/Fluid
   Compute/cron tuning needed - it's just your server, running continuously,
   the same way it does on your own machine.

Free tier Render services do spin down after inactivity too (a different
kind of "cold start") - a paid instance ($7/mo+) removes that entirely and
gets you the closest thing to "exactly like running it locally, but
public".
