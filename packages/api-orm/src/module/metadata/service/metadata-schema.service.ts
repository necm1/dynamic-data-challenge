import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetadataSchema } from '../entity/metadata-schema.entity';
import { EntityType, FieldType } from '@repo/shared';
import { MetadataValidationRule } from '../interface/metadata-validation-rule.interface';

@Injectable()
export class OrmMetadataSchemaService extends BaseRepository<MetadataSchema> {
  constructor(
    @InjectRepository(MetadataSchema)
    public metadataSchemaRepository: Repository<MetadataSchema>,
  ) {
    super(
      metadataSchemaRepository.target,
      metadataSchemaRepository.manager,
      metadataSchemaRepository.queryRunner,
    );
  }

  /**
   * Get all active schemas for an entity type
   */
  public async getActiveSchemas(entityType: EntityType) {
    return this.find({
      where: { entity_type: entityType, is_active: true },
      order: { display_order: 'ASC' },
      isCached: true,
      ttl: 300000,
    });
  }

  /**
   * Get schema for specific field
   */
  async getFieldSchema(entityType: EntityType, fieldKey: string) {
    return this.findOne({
      where: {
        entity_type: entityType,
        field_key: fieldKey,
        is_active: true,
      },
      isCached: true,
      ttl: 300000,
    });
  }

  /**
   * Create new field schema
   */
  async createSchema(
    entityType: EntityType,
    fieldKey: string,
    fieldType: FieldType,
    options?: {
      fieldLabel?: string;
      validationRules?: MetadataValidationRule;
      displayOrder?: number;
    },
  ) {
    const schema = this.create({
      entity_type: entityType,
      field_key: fieldKey,
      field_label: options?.fieldLabel || fieldKey,
      field_type: fieldType,
      validation_rules: options?.validationRules,
      display_order: options?.displayOrder || 0,
      is_active: true,
    });

    return this.save(schema);
  }

  /**
   * Validate field value against schema
   */
  async validateField(
    entityType: EntityType,
    fieldKey: string,
    value: any,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const schema = await this.getFieldSchema(entityType, fieldKey);

    if (!schema) {
      return {
        valid: false,
        errors: [`Field '${fieldKey}' not defined in schema`],
      };
    }

    const errors: string[] = [];

    // Required check
    if (
      schema.validation_rules?.required &&
      (value === null || value === undefined)
    ) {
      errors.push(`Field '${fieldKey}' is required`);
    }

    if (value === null || value === undefined) {
      return { valid: errors.length === 0, errors };
    }

    // Type-specific validation
    switch (schema.field_type) {
      case FieldType.NUMBER:
        if (typeof value !== 'number') {
          errors.push(`Field '${fieldKey}' must be a number`);
        } else {
          if (
            schema.validation_rules?.min !== undefined &&
            value < schema.validation_rules.min
          ) {
            errors.push(
              `Field '${fieldKey}' must be >= ${schema.validation_rules.min}`,
            );
          }
          if (
            schema.validation_rules?.max !== undefined &&
            value > schema.validation_rules.max
          ) {
            errors.push(
              `Field '${fieldKey}' must be <= ${schema.validation_rules.max}`,
            );
          }
        }
        break;

      case FieldType.SELECT:
        if (
          schema.validation_rules?.options &&
          !schema.validation_rules.options.includes(value)
        ) {
          errors.push(
            `Field '${fieldKey}' must be one of: ${schema.validation_rules.options.join(', ')}`,
          );
        }
        break;

      case FieldType.BOOLEAN:
        if (typeof value !== 'boolean') {
          errors.push(`Field '${fieldKey}' must be a boolean`);
        }
        break;

      case FieldType.ARRAY:
        if (!Array.isArray(value)) {
          errors.push(`Field '${fieldKey}' must be an array`);
        } else if (schema.validation_rules?.options) {
          const invalidValues = value.filter(
            (v) => !schema.validation_rules!.options!.includes(v),
          );
          if (invalidValues.length > 0) {
            errors.push(
              `Field '${fieldKey}' contains invalid values: ${invalidValues.join(', ')}`,
            );
          }
        }
        break;

      case FieldType.TEXT:
      case FieldType.STRING:
        if (typeof value !== 'string') {
          errors.push(`Field '${fieldKey}' must be a string`);
        } else {
          if (
            schema.validation_rules?.min &&
            value.length < schema.validation_rules.min
          ) {
            errors.push(
              `Field '${fieldKey}' must be at least ${schema.validation_rules.min} characters`,
            );
          }
          if (
            schema.validation_rules?.max &&
            value.length > schema.validation_rules.max
          ) {
            errors.push(
              `Field '${fieldKey}' must be at most ${schema.validation_rules.max} characters`,
            );
          }
          if (schema.validation_rules?.pattern) {
            const regex = new RegExp(schema.validation_rules.pattern);
            if (!regex.test(value)) {
              errors.push(
                `Field '${fieldKey}' does not match required pattern`,
              );
            }
          }
        }
        break;

      case FieldType.DATE:
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          errors.push(`Field '${fieldKey}' must be a valid date`);
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate all custom fields
   */
  async validateCustomFields(
    entityType: EntityType,
    customFields: Record<string, any>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const allErrors: string[] = [];

    for (const [key, value] of Object.entries(customFields)) {
      const { valid, errors } = await this.validateField(
        entityType,
        key,
        value,
      );
      if (!valid) {
        allErrors.push(...errors);
      }
    }

    return { valid: allErrors.length === 0, errors: allErrors };
  }

  public async findByEntityType(
    entity_type: EntityType,
  ): Promise<MetadataSchema[]> {
    return this.metadataSchemaRepository.find({
      where: { entity_type },
      order: { display_order: 'ASC' },
      cache: {
        id: `metadata_schema_${entity_type}`,
        milliseconds: 60000,
      },
    });
  }

  public async findActiveByEntityType(
    entity_type: EntityType,
  ): Promise<MetadataSchema[]> {
    return this.metadataSchemaRepository.find({
      where: {
        entity_type,
        is_active: true,
      },
      order: { display_order: 'ASC' },
      cache: true,
    });
  }
}
