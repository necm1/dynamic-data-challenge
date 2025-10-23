import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetadataSchema } from '../entity/metadata-schema.entity';
import { EntityType, FieldType } from '@repo/shared';
import { MetadataValidationRule } from '../interface/metadata-validation-rule.interface';
import { MetadataQueryOptions } from '../interface/metadata-query-options.interface';

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

  public async findSchemasWithPagination(options: MetadataQueryOptions) {
    const {
      entity_type,
      field_key,
      field_label,
      field_type,
      page = 1,
      perPage = 20,
    } = options;

    const queryBuilder = this.metadataSchemaRepository
      .createQueryBuilder('schema')
      .where('schema.entity_type = :entity_type', { entity_type })
      .andWhere('schema.is_active = :is_active', { is_active: true });

    if (field_key) {
      queryBuilder.andWhere('schema.field_key ILIKE :field_key', {
        field_key: `%${field_key}%`,
      });
    }

    if (field_label) {
      queryBuilder.andWhere('schema.field_label ILIKE :field_label', {
        field_label: `%${field_label}%`,
      });
    }

    if (field_type) {
      queryBuilder.andWhere('schema.field_type = :field_type', { field_type });
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .orderBy('schema.display_order', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    const totalPages = Math.ceil(total / perPage);

    return {
      status: 200,
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
      links: this.buildPaginationLinks(page, perPage, totalPages),
    };
  }

  /**
   * Get all active schemas for an entity type
   */
  public async getActiveSchemas(entityType: EntityType) {
    return this.find({
      where: { entity_type: entityType, is_active: true },
      order: { display_order: 'ASC' },
      isCached: true,
      ttl: 30000,
      cache: {
        id: `metadata:schema:${entityType}:active`,
        milliseconds: 30000,
      },
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
      ttl: 30000,
      cache: {
        id: `metadata_schema_${entityType}_field_${fieldKey}`,
        milliseconds: 30000,
      },
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
        id: `metadata:schema:${entity_type}`,
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
      cache: {
        id: `metadata:schema:${entity_type}`,
        milliseconds: 30000,
      },
    });
  }

  async invalidateCache(): Promise<void> {
    const entityTypes = [
      EntityType.Property,
      EntityType.Listing,
      EntityType.Client,
    ];

    for (const type of entityTypes) {
      const cacheId = `metadata:schema:${type}`;
      await this.metadataSchemaRepository.manager.connection.queryResultCache?.remove(
        [cacheId],
      );
    }
  }

  private buildPaginationLinks(
    page: number,
    perPage: number,
    totalPages: number,
  ): Record<string, string> {
    return {
      first: `?page=1&perPage=${perPage}`,
      last: `?page=${totalPages}&perPage=${perPage}`,
      prev: page > 1 ? `?page=${page - 1}&perPage=${perPage}` : '',
      next: page < totalPages ? `?page=${page + 1}&perPage=${perPage}` : '',
    };
  }
}
