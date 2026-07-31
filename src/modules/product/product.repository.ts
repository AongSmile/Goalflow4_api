import type { Product, Category, Subcategory, Brand, Image, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

export type ProductWithRelations = Product & {
  category: Category | null;
  subcategory: Subcategory | null;
  brand: Brand | null;
  images: Image[];
};

const INCLUDE = {
  category: true,
  subcategory: true,
  brand: true,
  images: true,
} as const;

export const productRepository = {
  create(data: Prisma.ProductCreateInput): Promise<ProductWithRelations> {
    return prisma.product.create({ data, include: INCLUDE });
  },

  // Legacy "latest N products" (used on the home page)
  findLatest(count: number): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      take: count,
      orderBy: { createdAt: "desc" },
      include: INCLUDE,
    });
  },

  findByCatalog(where: Prisma.ProductWhereInput): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: INCLUDE,
    });
  },

  findById(id: number): Promise<ProductWithRelations | null> {
    return prisma.product.findFirst({ where: { id }, include: INCLUDE });
  },

  findBySlug(slug: string): Promise<ProductWithRelations | null> {
    return prisma.product.findFirst({ where: { slug }, include: INCLUDE });
  },

  deleteImages(productId: number): Promise<Prisma.BatchPayload> {
    return prisma.image.deleteMany({ where: { productId } });
  },

  update(id: number, data: Prisma.ProductUpdateInput): Promise<ProductWithRelations> {
    return prisma.product.update({ where: { id }, data, include: INCLUDE });
  },

  remove(id: number): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  },

  findManySorted(
    orderBy: Prisma.ProductOrderByWithRelationInput,
    take?: number
  ): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({ take, orderBy, include: INCLUDE });
  },

  searchByTitle(query: string): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      include: INCLUDE,
    });
  },

  searchByPriceRange(min: number, max: number): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: { price: { gte: min, lte: max } },
      include: INCLUDE,
    });
  },

  searchByCategoryIds(categoryIds: number[]): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: { categoryId: { in: categoryIds } },
      include: INCLUDE,
    });
  },

  findAll(): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({ include: INCLUDE });
  },
};
