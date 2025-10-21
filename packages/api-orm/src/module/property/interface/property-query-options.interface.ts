export interface PropertyQueryOptions {
  page?: number;
  perPage?: number;
  minPrice?: number;
  maxPrice?: number;
  title?: string;
  customFields?: Record<string, any>;
}
