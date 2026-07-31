import type { Request, Response } from "express";
import { roleService } from "./role.service.js";
import type { CreateRoleDto, UpdateRoleDto } from "./role.types.js";

export const roleController = {
  async listPermissions(_req: Request, res: Response): Promise<void> {
    const permissions = await roleService.listPermissions();
    res.json(permissions);
  },

  async listRoles(_req: Request, res: Response): Promise<void> {
    const roles = await roleService.listRoles();
    res.json(roles);
  },

  async create(req: Request<unknown, unknown, CreateRoleDto>, res: Response): Promise<void> {
    const role = await roleService.create(req.body);
    res.send(role);
  },

  async update(req: Request<{ id: string }, unknown, UpdateRoleDto>, res: Response): Promise<void> {
    const role = await roleService.update(Number(req.params.id), req.body);
    res.send(role);
  },

  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    const role = await roleService.remove(Number(req.params.id));
    res.send(role);
  },
};
