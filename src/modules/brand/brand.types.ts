export interface CreateBrandDto {
  name: string;
  logoUrl?: string | null;
  url?: string | null;
  sortOrder?: number;
  status?: boolean;
}

export interface UpdateBrandDto {
  name?: string;
  logoUrl?: string | null;
  url?: string | null;
  sortOrder?: number;
  status?: boolean;
}

export interface BrandListQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}
