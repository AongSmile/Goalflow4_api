export interface ProductImageDto {
  asset_id: string;
  public_id: string;
  url: string;
  secure_url: string;
}

export interface CreateProductDto {
  slug?: string;
  title: string;
  subtitle?: string | null;
  description?: string;
  price?: number | string;
  quantity?: number | string;
  categoryId?: number | string | null;
  subcategoryId?: number | string | null;
  brandId?: number | string | null;
  lineUrl?: string | null;
  specPdf?: string | null;
  features?: string[];
  applications?: string[];
  thumbnail?: string | null;
  mainImage?: string | null;
  logoImage?: string | null;
  specImage?: string | null;
  deliveryImage?: string | null;
  images?: ProductImageDto[];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductCatalogQuery {
  category?: string;
  subcategory?: string;
}

export interface ListByDto {
  sort: string;
  order: "asc" | "desc";
  limit?: number;
}

export interface SearchFiltersDto {
  query?: string;
  category?: (number | string)[];
  price?: [number, number];
}
