'use server';

import { EntityType } from '@repo/shared';
import { API_URL } from '../constants';
import { PaginatedResponse } from '../types/paginated-response';
import { FieldType } from '../lib/schemas/metadata.schema.js';

export type BaseValidationRules = {
  required: boolean;
  description?: string;
};

export type NumberValidationRules = BaseValidationRules & {
  min?: number;
  max?: number;
};

export type SelectValidationRules = BaseValidationRules & {
  options: string[];
  multiple?: boolean;
};

export type StringValidationRules = BaseValidationRules & {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export type ValidationRules =
  | NumberValidationRules
  | SelectValidationRules
  | StringValidationRules
  | BaseValidationRules;

export type MetadataSchema = {
  id: string;
  entity_type: number;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  is_active: boolean;
  validation_rules?: ValidationRules;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export async function getMetadataSchemas(
  entityType: (typeof EntityType)[keyof typeof EntityType],
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

    return data;
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
  validation_rules?: ValidationRules;
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
    validation_rules?: Record<string, unknown>;
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

export async function getMetadataSchemasPaginated(params: {
  entity_type: EntityType;
  field_key?: string;
  field_label?: string;
  field_type?: string;
  page?: number;
  perPage?: number;
}): Promise<PaginatedResponse<MetadataSchema>> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(
    `${API_URL}/metadata?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch metadata schemas');
  }

  return response.json();
}
