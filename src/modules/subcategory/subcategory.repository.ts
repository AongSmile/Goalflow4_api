import type { Subcategory, Category, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

export type SubcategoryWithCategory = Subcategory & {
  category: Category;
};

export const subcategoryRepository = {
  create(data: Prisma.SubcategoryCreateInput): Promise<Subcategory> {
    return prisma.subcategory.create({ data });
  },

  findMany(
    where: Prisma.SubcategoryWhereInput,
    skip: number,
    take: number
  ): Promise<SubcategoryWithCategory[]> {
    return prisma.subcategory.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
  },

  count(where: Prisma.SubcategoryWhereInput): Promise<number> {
    return prisma.subcategory.count({ where });
  },

  update(id: number, data: Prisma.SubcategoryUpdateInput): Promise<SubcategoryWithCategory> {
    return prisma.subcategory.update({
      where: { id },
      data,
      include: { category: true },
    });
  },

  remove(id: number): Promise<Subcategory> {
    return prisma.subcategory.delete({ where: { id } });
  },
};
