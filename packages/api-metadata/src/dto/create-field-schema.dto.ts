import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsObject,
  MaxLength,
} from 'class-validator';
import { EntityType, FieldType } from '@repo/shared';

export class CreateFieldSchemaDto {
  @IsEnum(EntityType)
  entity_type: EntityType;

  @IsString()
  @MaxLength(100)
  field_key: string;

  @IsString()
  @MaxLength(100)
  field_label: string;

  @IsEnum(FieldType)
  field_type: FieldType;

  @IsObject()
  validation_rules: {
    required?: boolean;
    min?: number;
    max?: number;
    options?: string[];
    pattern?: string;
  };

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  display_order?: number;
}
