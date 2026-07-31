import type { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import type { ChangeOrderStatusDto, ChangeUserStatusDto, ChangeUserRoleDto } from "./admin.types.js";

export const adminController = {
  async listOrders(_req: Request, res: Response): Promise<void> {
    const orders = await adminService.listOrders();
    res.json(orders);
  },

  async changeOrderStatus(req: Request<unknown, unknown, ChangeOrderStatusDto>, res: Response): Promise<void> {
    const order = await adminService.changeOrderStatus(req.body);
    res.json(order);
  },

  async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await adminService.listUsers();
    res.json(users);
  },

  async changeStatus(req: Request<unknown, unknown, ChangeUserStatusDto>, res: Response): Promise<void> {
    const message = await adminService.changeUserStatus(req.body);
    res.send(message);
  },

  async changeRole(req: Request<unknown, unknown, ChangeUserRoleDto>, res: Response): Promise<void> {
    const message = await adminService.changeUserRole(req.body);
    res.send(message);
  },
};
