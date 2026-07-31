import type { Prisma } from "@prisma/client";
import cloudinary from "../../config/cloudinary.js";
import { productRepository, type ProductWithRelations } from "./product.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductCatalogQuery,
  ListByDto,
  SearchFiltersDto,
  ProductImageDto,
} from "./product.types.js";

function imagesCreateInput(images: ProductImageDto[] | undefined) {
  return {
    create: (images ?? []).map((item) => ({
      asset_id: item.asset_id,
      public_id: item.public_id,
      url: item.url,
      secure_url: item.secure_url,
    })),
  };
}

// Fields accepted from the admin product form. Anything not listed here is
// ignored so the client can't set things like `id`/`createdAt` directly.
function toCreateData(dto: CreateProductDto): Prisma.ProductCreateInput {
  return {
    slug: dto.slug || undefined,
    title: dto.title,
    subtitle: dto.subtitle || null,
    description: dto.description || "",
    price: dto.price !== undefined ? parseFloat(String(dto.price)) || 0 : undefined,
    quantity: dto.quantity !== undefined ? parseInt(String(dto.quantity), 10) || 0 : undefined,
    category: dto.categoryId ? { connect: { id: Number(dto.categoryId) } } : undefined,
    subcategory: dto.subcategoryId ? { connect: { id: Number(dto.subcategoryId) } } : undefined,
    brand: dto.brandId ? { connect: { id: Number(dto.brandId) } } : undefined,
    lineUrl: dto.lineUrl || null,
    specPdf: dto.specPdf || null,
    features: dto.features ?? [],
    applications: dto.applications ?? [],
    thumbnail: dto.thumbnail || null,
    mainImage: dto.mainImage || null,
    logoImage: dto.logoImage || null,
    specImage: dto.specImage || null,
    deliveryImage: dto.deliveryImage || null,
    images: imagesCreateInput(dto.images),
  };
}

function toUpdateData(dto: UpdateProductDto): Prisma.ProductUpdateInput {
  return {
    slug: dto.slug ?? undefined,
    title: dto.title ?? undefined,
    subtitle: dto.subtitle !== undefined ? dto.subtitle || null : undefined,
    description: dto.description ?? undefined,
    price: dto.price !== undefined ? parseFloat(String(dto.price)) || 0 : undefined,
    quantity: dto.quantity !== undefined ? parseInt(String(dto.quantity), 10) || 0 : undefined,
    category:
      dto.categoryId !== undefined
        ? dto.categoryId
          ? { connect: { id: Number(dto.categoryId) } }
          : { disconnect: true }
        : undefined,
    subcategory:
      dto.subcategoryId !== undefined
        ? dto.subcategoryId
          ? { connect: { id: Number(dto.subcategoryId) } }
          : { disconnect: true }
        : undefined,
    brand:
      dto.brandId !== undefined
        ? dto.brandId
          ? { connect: { id: Number(dto.brandId) } }
          : { disconnect: true }
        : undefined,
    lineUrl: dto.lineUrl !== undefined ? dto.lineUrl || null : undefined,
    specPdf: dto.specPdf !== undefined ? dto.specPdf || null : undefined,
    features: dto.features ?? undefined,
    applications: dto.applications ?? undefined,
    thumbnail: dto.thumbnail !== undefined ? dto.thumbnail || null : undefined,
    mainImage: dto.mainImage !== undefined ? dto.mainImage || null : undefined,
    logoImage: dto.logoImage !== undefined ? dto.logoImage || null : undefined,
    specImage: dto.specImage !== undefined ? dto.specImage || null : undefined,
    deliveryImage: dto.deliveryImage !== undefined ? dto.deliveryImage || null : undefined,
    ...(dto.images ? { images: imagesCreateInput(dto.images) } : {}),
  };
}

export const productService = {
  create(dto: CreateProductDto): Promise<ProductWithRelations> {
    return productRepository.create(toCreateData(dto));
  },

  list(count: number): Promise<ProductWithRelations[]> {
    return productRepository.findLatest(count);
  },

  listByCatalog(query: ProductCatalogQuery): Promise<ProductWithRelations[]> {
    const where: Prisma.ProductWhereInput = {
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.subcategory ? { subcategory: { slug: query.subcategory } } : {}),
    };
    return productRepository.findByCatalog(where);
  },

  async read(id: number): Promise<ProductWithRelations> {
    const product = await productRepository.findById(id);
    if (!product) throw AppError.notFound("Product not found!!!!");
    return product;
  },

  async readBySlug(slug: string): Promise<ProductWithRelations> {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw AppError.notFound("Product not found!!!!");
    return product;
  },

  async update(id: number, dto: UpdateProductDto): Promise<ProductWithRelations> {
    if (dto.images) {
      await productRepository.deleteImages(id);
    }
    return productRepository.update(id, toUpdateData(dto));
  },

  async remove(id: number): Promise<string> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.badRequest("Product not found!!!!");
    }

    // Best-effort cleanup of Cloudinary assets; don't let a single failed
    // delete block removing the product record.
    await Promise.all(
      product.images.map((image) =>
        cloudinary.uploader.destroy(image.public_id).catch((err: unknown) => {
          console.log("Cloudinary destroy failed for", image.public_id, err);
        })
      )
    );

    await productRepository.remove(id);
    return "Deleted Success";
  },

  listBy(dto: ListByDto): Promise<ProductWithRelations[]> {
    // `sort` is a field name chosen at runtime by the caller (e.g. "price",
    // "createdAt") - Prisma's OrderBy type wants a specific known shape, so
    // this cast documents that it's deliberately dynamic rather than a type
    // mismatch.
    const orderBy = { [dto.sort]: dto.order } as Prisma.ProductOrderByWithRelationInput;
    return productRepository.findManySorted(orderBy, dto.limit);
  },

  searchFilters(dto: SearchFiltersDto): Promise<ProductWithRelations[]> {
    if (dto.query) {
      return productRepository.searchByTitle(dto.query);
    }
    if (dto.category && dto.category.length > 0) {
      return productRepository.searchByCategoryIds(dto.category.map((id) => Number(id)));
    }
    if (dto.price) {
      return productRepository.searchByPriceRange(dto.price[0], dto.price[1]);
    }
    // No filters supplied -> return everything
    return productRepository.findAll();
  },

  async createImage(base64Image: string) {
    return cloudinary.uploader.upload(base64Image, {
      public_id: `GoldFlowin-${Date.now()}`,
      resource_type: "auto",
      folder: "GoldFlowin",
    });
  },

  async removeImage(publicId: string): Promise<string> {
    await cloudinary.uploader.destroy(publicId);
    return "Remove Image Success!!!";
  },
};
