import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { RegisterDto, LoginDto, GoogleLoginDto } from "./auth.types.js";

export const authController = {
  async register(req: Request<unknown, unknown, RegisterDto>, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    res.json(result);
  },

  async login(req: Request<unknown, unknown, LoginDto>, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    res.json(result);
  },

  async googleLogin(req: Request<unknown, unknown, GoogleLoginDto>, res: Response): Promise<void> {
    const result = await authService.googleLogin(req.body.credential);
    res.json(result);
  },

  async currentUser(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const user = await authService.currentUser(req.user.email);
    res.json({ user });
  },
};
