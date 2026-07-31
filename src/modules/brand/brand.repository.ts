import type { Brand, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

// Repository layer: raw Prisma access ONLY - no business rules, no
// req/res. Every module follows this same three-layer split (see
// server/README.md's Phase 4 section for why).
export const brandRepository = {
  create(data: Prisma.BrandCreateInput): Promise<Brand> {
    return prisma.brand.create({ data });
  },

  findMany(where: Prisma.BrandWhereInput, skip: number, take: number): Promise<Brand[]> {
    return prisma.brand.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  },

  count(where: Prisma.BrandWhereInput): Promise<number> {
    return prisma.brand.count({ where });
  },

  findEnabled(): Promise<Brand[]> {
    return prisma.brand.findMany({
      where: { status: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  },

  update(id: number, data: Prisma.BrandUpdateInput): Promise<Brand> {
    return prisma.brand.update({ where: { id }, data });
  },

  remove(id: number): Promise<Brand> {
    return prisma.brand.delete({ where: { id } });
  },
};
