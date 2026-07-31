// Vercel serverless entry point.
// ----------------------------------------------------------------------------
// This is separate from src/server.ts (which calls app.listen() for a
// traditional long-running Node process, e.g. Render/Railway/Fly/a VPS).
// Vercel's Node.js builder (@vercel/node) treats any file under /api as a
// serverless function - an Express `app` is itself a valid request handler
// ((req, res) => void), so exporting it directly is enough; Vercel calls it
// per-request instead of the app ever calling .listen().
//
// vercel.json's rewrite sends every request here, and this app's own
// internal routing (see ../src/app.ts -> app.use('/api', routes)) handles
// the rest exactly as it does in the traditional server.
import { createApp } from "../src/app.js";

const app = createApp();

export default app;
