import type { Article, ImageArticle, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

export type ArticleWithImages = Article & { images: ImageArticle[] };

export const articleRepository = {
  create(data: Prisma.ArticleCreateInput): Promise<ArticleWithImages> {
    return prisma.article.create({ data, include: { images: true } });
  },

  findMany(
    where: Prisma.ArticleWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ArticleOrderByWithRelationInput = { publishedAt: "desc" }
  ): Promise<ArticleWithImages[]> {
    return prisma.article.findMany({ where, skip, take, orderBy, include: { images: true } });
  },

  count(where: Prisma.ArticleWhereInput): Promise<number> {
    return prisma.article.count({ where });
  },

  findById(id: number): Promise<ArticleWithImages | null> {
    return prisma.article.findFirst({ where: { id }, include: { images: true } });
  },

  findPublishedById(id: number): Promise<ArticleWithImages | null> {
    return prisma.article.findFirst({ where: { id, status: true }, include: { images: true } });
  },

  deleteImages(articleId: number): Promise<Prisma.BatchPayload> {
    return prisma.imageArticle.deleteMany({ where: { articleId } });
  },

  update(id: number, data: Prisma.ArticleUpdateInput): Promise<ArticleWithImages> {
    return prisma.article.update({ where: { id }, data, include: { images: true } });
  },

  remove(id: number): Promise<Article> {
    return prisma.article.delete({ where: { id } });
  },
};
