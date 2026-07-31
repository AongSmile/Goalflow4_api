// Augments Express's Request type with the `user` property that
// authCheck middleware attaches after verifying the JWT and loading the
// user's role/permissions from the DB. Having this as ambient module
// augmentation (rather than a custom Request subtype threaded through
// every handler) keeps every controller's signature plain
// `(req: Request, res: Response)`.
import "express";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  // Populated by authCheck from the DB (see
  // src/shared/middlewares/authCheck.ts) - the JWT itself only carries
  // id/email/role. `dbRole` mirrors `role` (kept distinct historically -
  // see authCheck for why) and `permissions` is the resolved list of
  // permission keys granted via the user's assigned Role (staff only;
  // empty for "user"/"admin").
  dbRole: string;
  permissions: string[];
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}
