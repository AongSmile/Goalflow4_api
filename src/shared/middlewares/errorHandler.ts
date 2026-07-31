import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

// Centralized error handling (spec section 10: "จัดการ Error Handling อย่าง
// เหมาะสม") - every controller in this project is a plain async function
// with NO try/catch; Express 5 automatically forwards a rejected promise
// from an async route handler to this middleware via next(err), so a
// thrown AppError (or any other error) always ends up here exactly once,
// instead of each of ~40 handlers repeating its own try/catch/res.status(500).
//
// Must be registered LAST, after every route (see src/app.ts), and must
// keep all four parameters (Express identifies error-handling middleware
// by arity, not by name).
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Server Error!!!" });
}
