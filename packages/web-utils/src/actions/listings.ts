'use server';

import { revalidatePath } from 'next/cache';
import { API_URL } from '../constants';
import type { ListingStatus } from '@repo/shared';

export type Listing = {
  id: string;
  status: ListingStatus;
  price: number;
  property_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  property?: {
    id: string;
    title: string;
    address: string;
    price: number;
    year_built?: number;
  };
};

export type FindListingsParams = {
  page?: number;
  perPage?: number;
  status?: ListingStatus;
  minPrice?: number;
  maxPrice?: number;
  property_id?: string;
  customFields?: Record<string, unknown>;
};

export type PaginatedListings = {
  data: Listing[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

export async function getListings(
  params: FindListingsParams = {},
): Promise<PaginatedListings> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.perPage) searchParams.set('perPage', params.perPage.toString());
  if (params.status !== undefined)
    searchParams.set('status', params.status.toString());
  if (params.minPrice !== undefined)
    searchParams.set('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined)
    searchParams.set('maxPrice', params.maxPrice.toString());
  if (params.property_id) searchParams.set('property_id', params.property_id);
  if (params.customFields) {
    searchParams.set('customFields', JSON.stringify(params.customFields));
  }

  const url = `${API_URL}/listings?${searchParams.toString()}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to fetch listings' }));
    throw new Error(error.message || 'Failed to fetch listings');
  }

  return res.json();
}

export async function getListing(id: string): Promise<Listing> {
  const res = await fetch(`${API_URL}/listings/${id}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to fetch listing' }));
    throw new Error(error.message || 'Failed to fetch listing');
  }

  const json = await res.json();
  return json.data;
}

export async function createListing(data: {
  status: ListingStatus;
  price: number;
  property_id: string;
  fields?: Record<string, unknown>;
}): Promise<Listing> {
  const res = await fetch(`${API_URL}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to create listing' }));
    throw new Error(error.message || 'Failed to create listing');
  }

  const json = await res.json();
  revalidatePath('/listings');
  return json.data;
}

export async function updateListing(
  id: string,
  data: {
    status?: ListingStatus;
    price?: number;
    property_id?: string;
    fields?: Record<string, unknown>;
  },
): Promise<Listing> {
  const res = await fetch(`${API_URL}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to update listing' }));
    throw new Error(error.message || 'Failed to update listing');
  }

  const json = await res.json();
  revalidatePath('/listings');
  revalidatePath(`/listings/${id}`);
  return json.data;
}

export async function deleteListing(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/listings/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to delete listing' }));
    throw new Error(error.message || 'Failed to delete listing');
  }

  revalidatePath('/listings');
}
