export interface CreateSubcategoryDto {
  slug: string;
  title?: string | null;
  subtitle?: string | null;
  categoryId: number | string;
  status?: boolean;
}

export interface UpdateSubcategoryDto {
  slug?: string;
  title?: string | null;
  subtitle?: string | null;
  categoryId?: number | string;
  status?: boolean;
}

export interface SubcategoryListQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  category?: string;
}
