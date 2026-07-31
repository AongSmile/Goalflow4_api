import type { Request, Response } from "express";
import { articleService } from "./article.service.js";
import type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleListQuery,
  StorefrontArticleQuery,
} from "./article.types.js";

export const articleController = {
  async create(req: Request<unknown, unknown, CreateArticleDto>, res: Response): Promise<void> {
    const article = await articleService.create(req.body);
    res.send(article);
  },

  async list(req: Request<unknown, unknown, unknown, ArticleListQuery>, res: Response): Promise<void> {
    const result = await articleService.list(req.query);
    res.json(result);
  },

  async storefront(
    req: Request<unknown, unknown, unknown, StorefrontArticleQuery>,
    res: Response
  ): Promise<void> {
    const result = await articleService.storefront(req.query);
    res.json(result);
  },

  async storefrontOne(req: Request<{ id: string }>, res: Response): Promise<void> {
    const article = await articleService.storefrontOne(Number(req.params.id));
    res.json(article);
  },

  async update(req: Request<{ id: string }, unknown, UpdateArticleDto>, res: Response): Promise<void> {
    const article = await articleService.update(Number(req.params.id), req.body);
    res.send(article);
  },

  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    const message = await articleService.remove(Number(req.params.id));
    res.send(message);
  },

  async createImages(req: Request<unknown, unknown, { image: string }>, res: Response): Promise<void> {
    const result = await articleService.createImage(req.body.image);
    res.send(result);
  },

  async removeImage(req: Request<unknown, unknown, { public_id: string }>, res: Response): Promise<void> {
    const message = await articleService.removeImage(req.body.public_id);
    res.send(message);
  },
};
