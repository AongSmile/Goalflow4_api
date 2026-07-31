import type { Category, Subcategory, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

// A Category row with its Subcategory[] included - what the admin list and
// the public navbar both return (navbar just filters to enabled-only, see
// findNavbar below).
export type CategoryWithSubs = Category & {
  subcategories: Subcategory[];
};

export const categoryRepository = {
  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  },

  findMany(where: Prisma.CategoryWhereInput, skip: number, take: number): Promise<CategoryWithSubs[]> {
    return prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { subcategories: true },
    });
  },

  count(where: Prisma.CategoryWhereInput): Promise<number> {
    return prisma.category.count({ where });
  },

  update(id: number, data: Prisma.CategoryUpdateInput): Promise<CategoryWithSubs> {
    return prisma.category.update({
      where: { id },
      data,
      include: { subcategories: true },
    });
  },

  remove(id: number): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  },

  findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { slug } });
  },

  findSubcategoryBySlug(slug: string, categorySlug: string) {
    return prisma.subcategory.findFirst({
      where: { slug, category: { slug: categorySlug } },
    });
  },

  // Public Navbar data - every enabled Category with its enabled
  // Subcategory[], in display order. This is *the* query that makes the
  // Navbar dynamic (spec section 2).
  findNavbar(): Promise<CategoryWithSubs[]> {
    return prisma.category.findMany({
      where: { status: true },
      orderBy: { createdAt: "asc" },
      include: {
        subcategories: {
          where: { status: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },
};
