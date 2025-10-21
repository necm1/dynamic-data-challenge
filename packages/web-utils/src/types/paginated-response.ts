export type PaginatedResponse<T> = {
  status: number;
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};
