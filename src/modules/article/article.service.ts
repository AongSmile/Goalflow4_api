import type { Prisma } from "@prisma/client";
import cloudinary from "../../config/cloudinary.js";
import { articleRepository, type ArticleWithImages } from "./article.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { parsePagination, parseStatusFilter, getSearchTerm, buildMeta, type PaginationMeta } from "../../shared/utils/queryHelpers.js";
import type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleListQuery,
  StorefrontArticleQuery,
  ArticleImageDto,
} from "./article.types.js";

function imagesCreateInput(images: ArticleImageDto[] | undefined) {
  return {
    create: (images ?? []).map((item) => ({
      asset_id: item.asset_id,
      public_id: item.public_id,
      url: item.url,
      secure_url: item.secure_url,
    })),
  };
}

export const articleService = {
  create(dto: CreateArticleDto): Promise<ArticleWithImages> {
    return articleRepository.create({
      name: dto.name,
      excerpt: dto.excerpt || null,
      description: dto.description,
      status: dto.status ?? true,
      images: imagesCreateInput(dto.images),
    });
  },

  async list(query: ArticleListQuery): Promise<{ items: ArticleWithImages[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query);
    const status = parseStatusFilter(query);
    const search = getSearchTerm(query);

    const where: Prisma.ArticleWhereInput = {
      ...(status !== undefined ? { status } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      articleRepository.findMany(where, skip, limit),
      articleRepository.count(where),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async storefront(
    query: StorefrontArticleQuery
  ): Promise<{ items: ArticleWithImages[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query, 6);
    const where: Prisma.ArticleWhereInput = { status: true };

    const [items, total] = await Promise.all([
      articleRepository.findMany(where, skip, limit),
      articleRepository.count(where),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async storefrontOne(id: number): Promise<ArticleWithImages> {
    const article = await articleRepository.findPublishedById(id);
    if (!article) throw AppError.notFound("Article not found");
    return article;
  },

  async update(id: number, dto: UpdateArticleDto): Promise<ArticleWithImages> {
    if (dto.images) {
      await articleRepository.deleteImages(id);
    }
    return articleRepository.update(id, {
      name: dto.name ?? undefined,
      excerpt: dto.excerpt !== undefined ? dto.excerpt || null : undefined,
      description: dto.description ?? undefined,
      status: dto.status ?? undefined,
      ...(dto.images ? { images: imagesCreateInput(dto.images) } : {}),
    });
  },

  async remove(id: number): Promise<string> {
    const article = await articleRepository.findById(id);
    if (!article) {
      throw AppError.badRequest("Article not found!!!!");
    }

    await Promise.all(
      article.images.map((image) =>
        cloudinary.uploader.destroy(image.public_id).catch((err: unknown) => {
          console.log("Cloudinary destroy failed for", image.public_id, err);
        })
      )
    );

    await articleRepository.remove(id);
    return "Deleted Success";
  },

  async createImage(base64Image: string) {
    return cloudinary.uploader.upload(base64Image, {
      public_id: `GF-Article-${Date.now()}`,
      resource_type: "auto",
      folder: "GF-Article",
    });
  },

  async removeImage(publicId: string): Promise<string> {
    await cloudinary.uploader.destroy(publicId);
    return "Remove Image Success!!!";
  },
};
