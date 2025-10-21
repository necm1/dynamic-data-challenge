import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '@repo/shared';

export class FindFieldSchemasDto {
  @IsEnum(EntityType)
  @Type(() => Number)
  entity_type: EntityType;

  @IsOptional()
  @IsString()
  field_key?: string;

  @IsOptional()
  @IsString()
  field_label?: string;

  @IsOptional()
  @IsString()
  field_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  perPage?: number = 20;
}
