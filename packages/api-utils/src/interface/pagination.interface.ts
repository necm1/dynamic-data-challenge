export interface Pagination<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  links: {
    first: string;
    last: string;
    prev: string;
    next: string;
  };
}
