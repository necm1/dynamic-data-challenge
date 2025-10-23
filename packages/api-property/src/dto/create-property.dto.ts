import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

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

export class CreatePropertyDto {
  @IsString()
  @MaxLength(160)
  title: string;

  @IsString()
  @MaxLength(240)
  address: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  year_built?: number;

  @IsOptional()
  @IsObject()
  @IsFlatObject()
  fields?: Record<string, string | number | boolean | string[]>;
}
