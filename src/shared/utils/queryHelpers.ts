// Shared helpers for the list endpoints (Category/Subcategory/Brand/Article/
// Product) so pagination, search, and status filtering behave identically
// everywhere instead of being reinvented per module.

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Deliberately duck-typed to only the field(s) each helper needs (rather
// than e.g. `Record<string, unknown>`) so any DTO interface with a matching
// optional property - `{ page?: string }`, `{ status?: string }`, etc,
// like every *ListQuery in modules/*/*.types.ts - is assignable without an
// explicit index signature.
interface PageQuery {
  page?: unknown;
  limit?: unknown;
}
interface StatusQuery {
  status?: unknown;
}
interface SearchQuery {
  search?: unknown;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parsePagination(query: PageQuery, defaultLimit = 20): PaginationParams {
  const page = Math.max(1, parseInt(asString(query.page) ?? "", 10) || 1);
  const limit = Math.max(
    1,
    Math.min(100, parseInt(asString(query.limit) ?? "", 10) || defaultLimit)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ?status=true | ?status=false | (omitted) -> no filter, returns everything
export function parseStatusFilter(query: StatusQuery): boolean | undefined {
  const status = asString(query.status);
  if (status === "true") return true;
  if (status === "false") return false;
  return undefined;
}

export function getSearchTerm(query: SearchQuery): string | undefined {
  const search = asString(query.search);
  return search ? search : undefined;
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
