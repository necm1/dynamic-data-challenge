import { z } from 'zod';

export const PropertySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  address: z.string(),
  price: z.number(),
  year_built: z.number(),
  custom_fields: z.record(z.string(), z.unknown()),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Property = z.infer<typeof PropertySchema>;

export const CreatePropertySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  address: z.string().min(1, 'Address is required').max(500),
  price: z.number().positive('Price must be positive'),
  year_built: z
    .number()
    .int()
    .min(1800, 'Year must be after 1800')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  fields: z.record(z.string(), z.unknown()).optional(),
});

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;

export const UpdatePropertySchema = CreatePropertySchema.partial();
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;

export const PropertyFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  title: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export type PropertyFilters = z.infer<typeof PropertyFiltersSchema>;
