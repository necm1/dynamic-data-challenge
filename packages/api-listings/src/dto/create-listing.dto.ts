import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ListingStatus } from '@repo/shared';

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsFlatObject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFlatObject',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'object') return true;

          return Object.values(value).every((v) => {
            if (v === null || v === undefined) return true;
            const type = typeof v;
            return (
              type === 'string' ||
              type === 'number' ||
              type === 'boolean' ||
              Array.isArray(v)
            );
          });
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a flat object (no nested objects allowed)`;
        },
      },
    });
  };
}

export class CreateListingDto {
  @IsEnum(ListingStatus)
  status: ListingStatus;

  @IsNumber()
  @Min(0)
  price: number;

  @IsUUID()
  property_id: string;

  @IsOptional()
  @IsObject()
  @IsFlatObject()
  fields?: Record<string, string | number | boolean | string[]>;
}
