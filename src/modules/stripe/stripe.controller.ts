import type { Request, Response } from "express";
import { stripeService } from "./stripe.service.js";
import { AppError } from "../../shared/errors/AppError.js";

export const stripeController = {
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const result = await stripeService.createPaymentIntent(req.user.id);
    res.send(result);
  },
};
