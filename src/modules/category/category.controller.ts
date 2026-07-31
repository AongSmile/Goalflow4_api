import type { Request, Response } from "express";
import { categoryService } from "./category.service.js";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryListQuery,
  CategoryMetaParams,
} from "./category.types.js";

export const categoryController = {
  async create(req: Request<unknown, unknown, CreateCategoryDto>, res: Response): Promise<void> {
    const category = await categoryService.create(req.body);
    res.send(category);
  },

  async list(req: Request<unknown, unknown, unknown, CategoryListQuery>, res: Response): Promise<void> {
    const result = await categoryService.list(req.query);
    res.json(result);
  },

  async update(req: Request<{ id: string }, unknown, UpdateCategoryDto>, res: Response): Promise<void> {
    const category = await categoryService.update(Number(req.params.id), req.body);
    res.send(category);
  },

  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    const category = await categoryService.remove(Number(req.params.id));
    res.send(category);
  },

  async navbar(_req: Request, res: Response): Promise<void> {
    const categories = await categoryService.navbar();
    res.json(categories);
  },

  async meta(req: Request<CategoryMetaParams>, res: Response): Promise<void> {
    const meta = await categoryService.meta(req.params.category, req.params.subcategory);
    res.json(meta);
  },
};
