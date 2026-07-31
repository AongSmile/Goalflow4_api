import type { Request, Response } from "express";
import { brandService } from "./brand.service.js";
import type { CreateBrandDto, UpdateBrandDto, BrandListQuery } from "./brand.types.js";

// Controller layer: HTTP in/out only - parses req, calls the service, sends
// res. No business logic, no direct Prisma access, and (per the whole
// project's pattern since Express 5 forwards async rejections
// automatically) no try/catch - see shared/middlewares/errorHandler.ts.
export const brandController = {
  async create(req: Request<unknown, unknown, CreateBrandDto>, res: Response): Promise<void> {
    const brand = await brandService.create(req.body);
    res.send(brand);
  },

  async list(req: Request<unknown, unknown, unknown, BrandListQuery>, res: Response): Promise<void> {
    const result = await brandService.list(req.query);
    res.json(result);
  },

  async storefront(_req: Request, res: Response): Promise<void> {
    const brands = await brandService.storefront();
    res.json(brands);
  },

  async update(req: Request<{ id: string }, unknown, UpdateBrandDto>, res: Response): Promise<void> {
    const brand = await brandService.update(Number(req.params.id), req.body);
    res.send(brand);
  },

  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    const brand = await brandService.remove(Number(req.params.id));
    res.send(brand);
  },
};
