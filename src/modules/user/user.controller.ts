import type { Request, Response } from "express";
import { userService } from "./user.service.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { UserCartDto, SaveAddressDto, SaveOrderDto } from "./user.types.js";
import type { AuthUser } from "../../types/express.js";

// Deliberately duck-typed to just `{ user?: AuthUser }` rather than the
// full Express `Request` type: `Request`'s generics (P/ResBody/ReqBody/
// ReqQuery) make it invariant-ish in ways that break when a caller passes
// a `Request<unknown, unknown, SomeDto>` (a differently-parameterized
// Request) into a helper typed with the plain default `Request` - `unknown`
// isn't assignable to the default `ParamsDictionary`. Only needing `.user`
// here sidesteps that entirely.
function requireUserId(req: { user?: AuthUser }): number {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export const userController = {
  async userCart(req: Request<unknown, unknown, UserCartDto>, res: Response): Promise<void> {
    const result = await userService.userCart(requireUserId(req), req.body);
    res.json(result);
  },

  async getUserCart(req: Request, res: Response): Promise<void> {
    const result = await userService.getUserCart(requireUserId(req));
    res.json(result);
  },

  async emptyCart(req: Request, res: Response): Promise<void> {
    const result = await userService.emptyCart(requireUserId(req));
    res.json(result);
  },

  async saveAddress(req: Request<unknown, unknown, SaveAddressDto>, res: Response): Promise<void> {
    const result = await userService.saveAddress(requireUserId(req), req.body);
    res.json(result);
  },

  async saveOrder(req: Request<unknown, unknown, SaveOrderDto>, res: Response): Promise<void> {
    const result = await userService.saveOrder(requireUserId(req), req.body);
    res.json(result);
  },

  async getOrders(req: Request, res: Response): Promise<void> {
    const result = await userService.getOrders(requireUserId(req));
    res.json(result);
  },
};
