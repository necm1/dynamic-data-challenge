import { EntityType } from '@repo/shared';

export interface MetadataQueryOptions {
  entity_type: EntityType;
  field_key?: string;
  field_label?: string;
  field_type?: string;
  page?: number;
  perPage?: number;
}
