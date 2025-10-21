'use server';

import { API_URL } from '../constants';
import { PaginatedResponse } from '../types/paginated-response';

export type PropertyFilterParams = {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  customFields?: Record<string, any>;
};

export async function getProperties(params: {
  params: PropertyFilterParams[];
  page: number;
  perPage: number;
}): Promise<PaginatedResponse<any>> {
  const { page, perPage, params: filterParams } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('perPage', perPage.toString());

  if (filterParams.length > 0) {
    const filters = filterParams[0];
    if (filters?.title) searchParams.set('title', filters.title);
    if (filters?.minPrice)
      searchParams.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice)
      searchParams.set('maxPrice', filters.maxPrice.toString());
    if (filters?.customFields) {
      searchParams.set('customFields', JSON.stringify(filters.customFields));
    }
  }

  const response = await fetch(
    `${API_URL}/properties?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getPropertyById(id: string): Promise<any> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function createProperty(data: {
  title: string;
  address: string;
  price: number;
  year_built: number;
  fields?: Record<string, any>;
}): Promise<any> {
  const response = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `HTTP ${response.status}: Failed to create property`,
    );
  }

  return response.json();
}

export async function updateProperty(
  id: string,
  data: {
    title?: string;
    address?: string;
    price?: number;
    year_built?: number;
    fields?: Record<string, any>;
  },
): Promise<any> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `HTTP ${response.status}: Failed to update property`,
    );
  }

  return response.json();
}

export async function deleteProperty(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete property');
  }
}
