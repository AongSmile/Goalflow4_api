import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";
import { AppError } from "../errors/AppError.js";
import type { AuthUser } from "../../types/express.js";

// JWT payload shape as signed in auth.service.ts's signToken() - kept
// separate from AuthUser (the DB-enriched version authCheck attaches to
// req.user) since the token itself only ever carries id/email/role.
interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export async function authCheck(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const headerToken = req.headers.authorization;
    if (!headerToken) {
      throw AppError.unauthorized("No Token, Authorization");
    }
    const token = headerToken.split(" ")[1];
    if (!token || !process.env.SECRET) {
      throw AppError.unauthorized("Token Invalid");
    }

    const decoded = jwt.verify(token, process.env.SECRET) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: { email: decoded.email },
      include: { roleRef: { include: { permissions: true } } },
    });

    if (!user) {
      throw AppError.unauthorized("User not found");
    }
    if (!user.enabled) {
      throw AppError.badRequest("This account cannot access");
    }

    // Attach the DB role + resolved permission keys so downstream route
    // handlers/middlewares (permissionCheck below, adminCheck) don't need
    // another query. Only "staff" users have a roleRef; "admin" bypasses
    // permission checks entirely (see permissionCheck), "user" has none.
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      dbRole: user.role,
      permissions: user.roleRef?.permissions.map((p) => p.key) ?? [],
    };
    req.user = authUser;

    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(AppError.unauthorized("Token Invalid"));
  }
}

export async function adminCheck(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const adminUser = await prisma.user.findFirst({ where: { email: req.user.email } });
    if (!adminUser || adminUser.role !== "admin") {
      throw AppError.forbidden("Access Denied: Admin Only");
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Route-level RBAC for the CMS: admin always passes; a "staff" user passes
// only if their assigned Role was granted this specific permission key;
// anyone else (including plain "user" customers) is denied.
//
// Usage: router.post('/products', authCheck, permissionCheck('product.create'), create)
//
// Must run *after* authCheck (needs req.user.dbRole / req.user.permissions).
export function permissionCheck(key: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized("No Token, Authorization"));
    }
    if (req.user.dbRole === "admin") {
      return next();
    }
    if (req.user.dbRole === "staff" && req.user.permissions.includes(key)) {
      return next();
    }
    next(AppError.forbidden(`Access Denied: missing permission "${key}"`));
  };
}
