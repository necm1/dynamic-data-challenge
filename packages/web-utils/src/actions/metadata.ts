'use server';

import { API_URL } from '../constants';

export type MetadataSchema = {
  id: string;
  entity_type: number;
  field_key: string;
  field_label: string;
  field_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'SELECT' | 'TEXT';
  is_required: boolean;
  is_active: boolean;
  validation_rules?: Record<string, any>;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  status: number;
  data: T[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export async function getMetadataSchemas(
  entityType: number,
): Promise<PaginatedResponse<MetadataSchema>> {
  try {
    const response = await fetch(`${API_URL}/metadata/schema/${entityType}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data
  } catch (error) {
    console.error('Failed to fetch metadata schemas:', error);
    throw error;
  }
}

export async function createMetadataSchema(dto: {
  entity_type: number;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required?: boolean;
  validation_rules?: Record<string, any>;
  display_order?: number;
}): Promise<MetadataSchema> {
  const response = await fetch(`${API_URL}/metadata/schema`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
}

export async function updateMetadataSchema(
  id: string,
  dto: {
    field_label?: string;
    validation_rules?: Record<string, any>;
    display_order?: number;
    is_active?: boolean;
  },
): Promise<MetadataSchema> {
  const response = await fetch(`${API_URL}/metadata/schema/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
}

export async function deleteMetadataSchema(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/metadata/schema/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete metadata schema');
  }
}
