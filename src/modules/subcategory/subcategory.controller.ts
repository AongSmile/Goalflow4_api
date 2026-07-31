import type { Request, Response } from "express";
import { subcategoryService } from "./subcategory.service.js";
import type {
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
  SubcategoryListQuery,
} from "./subcategory.types.js";

export const subcategoryController = {
  async create(req: Request<unknown, unknown, CreateSubcategoryDto>, res: Response): Promise<void> {
    const subcategory = await subcategoryService.create(req.body);
    res.send(subcategory);
  },

  async list(req: Request<unknown, unknown, unknown, SubcategoryListQuery>, res: Response): Promise<void> {
    const result = await subcategoryService.list(req.query);
    res.json(result);
  },

  async update(req: Request<{ id: string }, unknown, UpdateSubcategoryDto>, res: Response): Promise<void> {
    const subcategory = await subcategoryService.update(Number(req.params.id), req.body);
    res.send(subcategory);
  },

  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    const subcategory = await subcategoryService.remove(Number(req.params.id));
    res.send(subcategory);
  },
};
