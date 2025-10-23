import { IsObject } from 'class-validator';

export class UpdateMetadataDto {
  @IsObject()
  fields: Record<string, any>;
}
