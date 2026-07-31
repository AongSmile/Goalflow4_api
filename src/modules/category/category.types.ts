export interface CreateCategoryDto {
  name: string;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  status?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  status?: boolean;
}

export interface CategoryListQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}

export interface CategoryMetaParams {
  category: string;
  subcategory?: string;
}
