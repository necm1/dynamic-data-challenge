import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiFetch,
  ApiPaginatedResponseSchema,
  ApiResponseSchema,
} from '../client';
import {
  PropertySchema,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
} from '../schemas/property.schema';

export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters: PropertyFilters) =>
    [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
};

export function useProperties(
  filters: PropertyFilters = { page: 1, perPage: 20 },
) {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.perPage) params.set('perPage', filters.perPage.toString());
      if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
      if (filters.title) params.set('title', filters.title);
      if (filters.customFields) {
        params.set('customFields', JSON.stringify(filters.customFields));
      }

      const data = await apiFetch(`/properties?${params.toString()}`);

      // Validate response
      const ResponseSchema = ApiPaginatedResponseSchema(PropertySchema);
      return ResponseSchema.parse(data);
    },
  });
}

// Get single property hook
export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: async () => {
      const data = await apiFetch(`/properties/${id}`);
      const ResponseSchema = ApiResponseSchema(PropertySchema);
      return ResponseSchema.parse(data);
    },
    enabled: !!id,
  });
}

// Create property mutation
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePropertyInput) => {
      const data = await apiFetch('/properties', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      const ResponseSchema = ApiResponseSchema(PropertySchema);
      return ResponseSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

// Update property mutation
export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePropertyInput) => {
      const data = await apiFetch(`/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      const ResponseSchema = ApiResponseSchema(PropertySchema);
      return ResponseSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

// Delete property mutation
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/properties/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}
