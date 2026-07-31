export interface ArticleImageDto {
  asset_id: string;
  public_id: string;
  url: string;
  secure_url: string;
}

export interface CreateArticleDto {
  name: string;
  excerpt?: string | null;
  description: string;
  status?: boolean;
  images?: ArticleImageDto[];
}

export interface UpdateArticleDto {
  name?: string;
  excerpt?: string | null;
  description?: string;
  status?: boolean;
  images?: ArticleImageDto[];
}

export interface ArticleListQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}

export interface StorefrontArticleQuery {
  page?: string;
  limit?: string;
}
