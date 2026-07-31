import type { Brand, Prisma } from "@prisma/client";
import { brandRepository } from "./brand.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { parsePagination, parseStatusFilter, getSearchTerm, buildMeta, type PaginationMeta } from "../../shared/utils/queryHelpers.js";
import type { CreateBrandDto, UpdateBrandDto, BrandListQuery } from "./brand.types.js";

export const brandService = {
  async create(dto: CreateBrandDto): Promise<Brand> {
    if (!dto.name?.trim()) {
      throw AppError.badRequest("Name is required!!!");
    }
    return brandRepository.create({
      name: dto.name,
      logoUrl: dto.logoUrl || null,
      url: dto.url || null,
      sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) : 0,
      status: dto.status ?? true,
    });
  },

  async list(query: BrandListQuery): Promise<{ items: Brand[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query);
    const status = parseStatusFilter(query);
    const search = getSearchTerm(query);

    const where: Prisma.BrandWhereInput = {
      ...(status !== undefined ? { status } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      brandRepository.findMany(where, skip, limit),
      brandRepository.count(where),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  storefront(): Promise<Brand[]> {
    return brandRepository.findEnabled();
  },

  async update(id: number, dto: UpdateBrandDto): Promise<Brand> {
    return brandRepository.update(id, {
      name: dto.name ?? undefined,
      logoUrl: dto.logoUrl !== undefined ? dto.logoUrl || null : undefined,
      url: dto.url !== undefined ? dto.url || null : undefined,
      sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) : undefined,
      status: dto.status ?? undefined,
    });
  },

  remove(id: number): Promise<Brand> {
    return brandRepository.remove(id);
  },
};
