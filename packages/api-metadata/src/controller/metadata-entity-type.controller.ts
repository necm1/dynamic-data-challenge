import {
  Controller,
  Get,
  Body,
  Param,
  Put,
  ParseEnumPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrmMetadataEntryService } from '@repo/api-orm';
import { EntityType } from '@repo/shared';
import { UpdateMetadataDto } from '../dto/update-metadata.dto';

@Controller('metadata/:entityType')
export class MetadataEntityTypeController {
  constructor(private metadataEntryService: OrmMetadataEntryService) {}

  @Get(':entityId')
  async getMetadata(
    @Param('entityType', new ParseEnumPipe(EntityType)) entityType: EntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.metadataEntryService.findEntry(entityType, entityId);
  }

  @Put(':entityId')
  async updateMetadata(
    @Param('entityType', new ParseEnumPipe(EntityType)) entityType: EntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: UpdateMetadataDto,
  ) {
    return this.metadataEntryService.doUpsert(entityType, entityId, dto.fields);
  }
}
