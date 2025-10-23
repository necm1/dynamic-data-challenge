'use server';

import { revalidatePath } from 'next/cache';
import { API_URL } from '../constants';

export type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown>;
};

export type FindClientsParams = {
  page?: number;
  perPage?: number;
  name?: string;
  email?: string;
  customFields?: Record<string, unknown>;
};

export type PaginatedClients = {
  data: Client[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

export async function getClients(
  params: FindClientsParams = {},
): Promise<PaginatedClients> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.perPage) searchParams.set('perPage', params.perPage.toString());
  if (params.name) searchParams.set('name', params.name);
  if (params.email) searchParams.set('email', params.email);
  if (params.customFields) {
    searchParams.set('customFields', JSON.stringify(params.customFields));
  }

  const url = `${API_URL}/clients?${searchParams.toString()}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to fetch clients' }));
    throw new Error(error.message || 'Failed to fetch clients');
  }

  return res.json();
}

export async function getClient(id: string): Promise<Client> {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to fetch client' }));
    throw new Error(error.message || 'Failed to fetch client');
  }

  const json = await res.json();
  return json.data;
}

export async function createClient(data: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  fields?: Record<string, unknown>;
}): Promise<Client> {
  const res = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to create client' }));
    throw new Error(error.message || 'Failed to create client');
  }

  const json = await res.json();
  revalidatePath('/clients');
  return json.data;
}

export async function updateClient(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    fields?: Record<string, unknown>;
  },
): Promise<Client> {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to update client' }));
    throw new Error(error.message || 'Failed to update client');
  }

  const json = await res.json();
  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
  return json.data;
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Failed to delete client' }));
    throw new Error(error.message || 'Failed to delete client');
  }

  revalidatePath('/clients');
}
