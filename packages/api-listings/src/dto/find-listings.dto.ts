import {
  IsOptional,
  IsNumber,
  IsObject,
  Min,
  Max,
  IsInt,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ListingStatus } from '@repo/shared';

export class FindListingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number = 20;

  @IsOptional()
  @IsEnum(ListingStatus)
  @Type(() => Number)
  status?: ListingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsUUID()
  property_id?: string;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        try {
          const decoded = decodeURIComponent(value);
          return JSON.parse(decoded);
        } catch {
          return {};
        }
      }
    }
    return value || {};
  })
  customFields?: Record<string, any>;
}
