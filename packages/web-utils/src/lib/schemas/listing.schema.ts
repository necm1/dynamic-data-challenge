import { z } from 'zod';
import { ListingStatus } from '@repo/shared';

export const ListingStatusSchema = z.enum(ListingStatus);

export const ListingSchema = z.object({
  id: z.string().uuid(),
  status: ListingStatusSchema,
  price: z.number(),
  property_id: z.string().uuid(),
  property: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      address: z.string(),
      price: z.number(),
      year_built: z.number(),
    })
    .optional(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Listing = z.infer<typeof ListingSchema>;

export const CreateListingSchema = z.object({
  status: ListingStatusSchema.default(ListingStatus.ACTIVE),
  price: z.coerce.number().positive('Price must be positive'),
  property_id: z.string().uuid('Invalid property ID'),
  fields: z.record(z.string(), z.unknown()).optional(),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

export const UpdateListingSchema = CreateListingSchema.partial();
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

export const ListingFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
  status: ListingStatusSchema.optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  property_id: z.string().uuid().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export type ListingFilters = z.infer<typeof ListingFiltersSchema>;
