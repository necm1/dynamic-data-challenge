import { z } from 'zod';
import {
  EntityType as EntityTypeEnum,
  FieldType as FieldTypeEnum,
} from '@repo/shared';

export const FieldTypeSchema = z.enum(FieldTypeEnum);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const EntityTypeSchema = z.enum(EntityTypeEnum);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const ValidationRulesSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  options: z.array(z.string()).optional(),
});
export type ValidationRules = z.infer<typeof ValidationRulesSchema>;

export const MetadataSchemaSchema = z.object({
  id: z.uuid(),
  entity_type: EntityTypeSchema,
  field_key: z.string(),
  field_label: z.string(),
  field_type: FieldTypeSchema,
  validation_rules: ValidationRulesSchema,
  is_active: z.boolean(),
  display_order: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MetadataSchema = z.infer<typeof MetadataSchemaSchema>;

export const CreateMetadataSchemaSchema = z.object({
  entity_type: EntityTypeSchema,
  field_key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z_]+$/, 'Must be lowercase with underscores only'),
  field_label: z.string().min(1).max(100),
  field_type: FieldTypeSchema,
  validation_rules: ValidationRulesSchema.optional(),
  display_order: z.number().int().positive().optional(),
  is_active: z.boolean().default(true),
});
export type CreateMetadataSchemaInput = z.infer<
  typeof CreateMetadataSchemaSchema
>;

export const UpdateMetadataSchemaSchema =
  CreateMetadataSchemaSchema.partial().omit({
    entity_type: true,
    field_key: true,
  });
export type UpdateMetadataSchemaInput = z.infer<
  typeof UpdateMetadataSchemaSchema
>;
