import {
  IsOptional,
  IsBoolean,
  IsInt,
  IsObject,
  IsString,
} from 'class-validator';
import type { MetadataValidationRule } from '@repo/api-orm';

export class UpdateFieldSchemaDto {
  @IsOptional()
  @IsString()
  field_label?: string;

  @IsOptional()
  @IsObject()
  validation_rules?: MetadataValidationRule;

  @IsOptional()
  @IsInt()
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
