import type { Prisma, Subcategory } from "@prisma/client";
import { subcategoryRepository, type SubcategoryWithCategory } from "./subcategory.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { parsePagination, parseStatusFilter, getSearchTerm, buildMeta, type PaginationMeta } from "../../shared/utils/queryHelpers.js";
import type { CreateSubcategoryDto, UpdateSubcategoryDto, SubcategoryListQuery } from "./subcategory.types.js";

export const subcategoryService = {
  create(dto: CreateSubcategoryDto): Promise<Subcategory> {
    if (!dto.slug?.trim() || !dto.categoryId) {
      throw AppError.badRequest("slug and categoryId are required!!!");
    }
    return subcategoryRepository.create({
      slug: dto.slug,
      title: dto.title || null,
      subtitle: dto.subtitle || null,
      status: dto.status ?? true,
      category: { connect: { id: Number(dto.categoryId) } },
    });
  },

  async list(
    query: SubcategoryListQuery
  ): Promise<{ items: SubcategoryWithCategory[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query);
    const status = parseStatusFilter(query);
    const search = getSearchTerm(query);

    const where: Prisma.SubcategoryWhereInput = {
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      subcategoryRepository.findMany(where, skip, limit),
      subcategoryRepository.count(where),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  // Also handles "ย้ายไปยังหมวดหมู่หลักอื่น" - just pass a new categoryId.
  update(id: number, dto: UpdateSubcategoryDto): Promise<SubcategoryWithCategory> {
    return subcategoryRepository.update(id, {
      slug: dto.slug ?? undefined,
      title: dto.title !== undefined ? dto.title || null : undefined,
      subtitle: dto.subtitle !== undefined ? dto.subtitle || null : undefined,
      status: dto.status ?? undefined,
      category: dto.categoryId !== undefined ? { connect: { id: Number(dto.categoryId) } } : undefined,
    });
  },

  remove(id: number) {
    return subcategoryRepository.remove(id);
  },
};
