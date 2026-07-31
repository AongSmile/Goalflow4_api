import type { Request, Response } from "express";
import { productService } from "./product.service.js";
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductCatalogQuery,
  ListByDto,
  SearchFiltersDto,
} from "./product.types.js";

export const productController = {
  async create(req: Request<unknown, unknown, CreateProductDto>, res: Response): Promise<void> {
    const product = await productService.create(req.body);
    res.send(product);
  },

  async list(req: Request<{ count: string }>, res: Response): Promise<void> {
    const products = await productService.list(parseInt(req.params.count, 10));
    res.send(products);
  },

  async listByCatalog(
    req: Request<unknown, unknown, unknown, ProductCatalogQuery>,
    res: Response
  ): Promise<void> {
    const products = await productService.listByCatalog(req.query);
    res.send(products);
  },

  async read(req: Request<{ id: string }>, res: Response): Promise<void> {
    const product = await productService.read(Number(req.params.id));
    res.send(product);
  },

  async readBySlug(req: Request<{ slug: string }>, res: Response): Promise<void> {
    const product = await productService.readBySlug(req.params.slug);
    res.send(product);
  },

  async update(req: Request<{ id: string }, unknown, UpdateProductDto>, res: Response): Promise<void> {
    const product = await productService.update(Number(req.params.id), req.body);
    res.send(product);
  },

  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    const message = await productService.remove(Number(req.params.id));
    res.send(message);
  },

  async listby(req: Request<unknown, unknown, ListByDto>, res: Response): Promise<void> {
    const products = await productService.listBy(req.body);
    res.send(products);
  },

  async searchFilters(req: Request<unknown, unknown, SearchFiltersDto>, res: Response): Promise<void> {
    const products = await productService.searchFilters(req.body);
    res.send(products);
  },

  async createImages(req: Request<unknown, unknown, { image: string }>, res: Response): Promise<void> {
    const result = await productService.createImage(req.body.image);
    res.send(result);
  },

  async removeImage(req: Request<unknown, unknown, { public_id: string }>, res: Response): Promise<void> {
    const message = await productService.removeImage(req.body.public_id);
    res.send(message);
  },
};
