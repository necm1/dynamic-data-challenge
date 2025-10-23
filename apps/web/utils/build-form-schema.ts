import {
  MetadataSchema,
  SelectValidationRules,
} from '@repo/web-utils/actions/metadata';
import { z } from 'zod';

export function buildFormSchema<T = unknown>(
  schemas: MetadataSchema[],
  baseCoreSchema: z.ZodObject,
) {
  const customFieldsSchema: Record<string, z.ZodTypeAny> = {};

  schemas.forEach((schema) => {
    let fieldSchema: z.ZodTypeAny;

    switch (schema.field_type) {
      case 'NUMBER':
        fieldSchema = z.coerce.number();
        break;
      case 'BOOLEAN':
        fieldSchema = z.boolean();
        break;
      case 'DATE':
        fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
        break;
      case 'SELECT':
        const select = schema.validation_rules as
          | SelectValidationRules
          | undefined;
        const options = select?.options;
        const isMultiple = select?.multiple === true;

        if (isMultiple) {
          fieldSchema = z.array(z.enum(options as [string, ...string[]]));
        } else {
          fieldSchema = z.enum(options as [string, ...string[]]);
        }
        break;
      case 'ARRAY':
        const arrayRules = schema.validation_rules as
          | SelectValidationRules
          | undefined;
        const arrayOptions = arrayRules?.options;

        if (arrayOptions && arrayOptions.length > 0) {
          fieldSchema = z.array(z.enum(arrayOptions as [string, ...string[]]));
        } else {
          fieldSchema = z.array(z.string());
        }
        break;
      case 'TEXT':
      case 'STRING':
      default:
        fieldSchema = z.string();
        break;
    }

    if (!schema.validation_rules?.required) {
      fieldSchema = fieldSchema.optional();
    }

    customFieldsSchema[schema.field_key] = fieldSchema;
  });

  return baseCoreSchema.extend({
    fields: z.object(customFieldsSchema).optional(),
  });
}
