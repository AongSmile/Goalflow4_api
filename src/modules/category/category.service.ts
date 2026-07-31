import type { Prisma } from "@prisma/client";
import { categoryRepository, type CategoryWithSubs } from "./category.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { parsePagination, parseStatusFilter, getSearchTerm, buildMeta, type PaginationMeta } from "../../shared/utils/queryHelpers.js";
import type { CreateCategoryDto, UpdateCategoryDto, CategoryListQuery } from "./category.types.js";

export interface CategoryMeta {
  title: string | null;
  subtitle: string | null;
}

export const categoryService = {
  async create(dto: CreateCategoryDto): Promise<CategoryWithSubs> {
    if (!dto.name?.trim()) {
      throw AppError.badRequest("Name is required!!!");
    }
    const created = await categoryRepository.create({
      name: dto.name,
      slug: dto.slug || null,
      title: dto.title || null,
      subtitle: dto.subtitle || null,
      status: dto.status ?? true,
    });
    // create() doesn't include subcategories (there can't be any for a
    // brand-new row) - shape it to match CategoryWithSubs for callers.
    return { ...created, subcategories: [] };
  },

  async list(query: CategoryListQuery): Promise<{ items: CategoryWithSubs[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query);
    const status = parseStatusFilter(query);
    const search = getSearchTerm(query);

    const where: Prisma.CategoryWhereInput = {
      ...(status !== undefined ? { status } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      categoryRepository.findMany(where, skip, limit),
      categoryRepository.count(where),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  update(id: number, dto: UpdateCategoryDto): Promise<CategoryWithSubs> {
    return categoryRepository.update(id, {
      name: dto.name ?? undefined,
      slug: dto.slug !== undefined ? dto.slug || null : undefined,
      title: dto.title !== undefined ? dto.title || null : undefined,
      subtitle: dto.subtitle !== undefined ? dto.subtitle || null : undefined,
      status: dto.status ?? undefined,
    });
  },

  remove(id: number) {
    return categoryRepository.remove(id);
  },

  navbar(): Promise<CategoryWithSubs[]> {
    return categoryRepository.findNavbar();
  },

  // Storefront listing-page heading (title/subtitle) for a category, or a
  // category+subcategory pair.
  async meta(category: string, subcategory?: string): Promise<CategoryMeta> {
    if (subcategory) {
      const sub = await categoryRepository.findSubcategoryBySlug(subcategory, category);
      if (!sub) throw AppError.notFound();
      return { title: sub.title, subtitle: sub.subtitle };
    }
    const cat = await categoryRepository.findBySlug(category);
    if (!cat) throw AppError.notFound();
    return { title: cat.title, subtitle: cat.subtitle };
  },
};
