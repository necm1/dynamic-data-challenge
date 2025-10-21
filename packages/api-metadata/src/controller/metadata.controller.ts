import {
  Controller,
  Get,
  Logger,
  Post,
  Body,
  Param,
  ParseEnumPipe,
  ConflictException,
  NotFoundException,
  ParseUUIDPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { OrmMetadataSchemaService } from '@repo/api-orm';
import { CreateFieldSchemaDto } from '../dto/create-field-schema.dto';
import { EntityType } from '@repo/shared';
import { UpdateFieldSchemaDto } from '../dto/update-field-schema.dto';

@Controller('metadata')
export class MetadataController {
  private readonly logger: Logger = new Logger(MetadataController.name);

  constructor(private metadataSchemaService: OrmMetadataSchemaService) {}

  @Get('schema/:entityType')
  async getSchema(
    @Param('entityType', new ParseEnumPipe(EntityType)) entityType: EntityType,
  ) {
    this.logger.log(`Getting metadata schema for entity type: ${entityType}`);
    return this.metadataSchemaService.findActiveByEntityType(entityType);
  }

  @Post('schema')
  public async createFieldSchema(@Body() dto: CreateFieldSchemaDto) {
    const existing = await this.metadataSchemaService.findOne({
      where: {
        entity_type: dto.entity_type,
        field_key: dto.field_key,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Field "${dto.field_key}" already exists for entity type ${dto.entity_type}`,
      );
    }

    const schema = this.metadataSchemaService.create(dto);
    return this.metadataSchemaService.save(schema);
  }

  @Put('schema/:id')
  async updateSchema(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFieldSchemaDto,
  ) {
    const schema = await this.metadataSchemaService.findOne({ where: { id } });

    if (!schema) {
      throw new NotFoundException(`Field schema with ID ${id} not found`);
    }

    if (dto.field_label !== undefined) schema.field_label = dto.field_label;
    if (dto.validation_rules !== undefined)
      schema.validation_rules = dto.validation_rules;
    if (dto.display_order !== undefined)
      schema.display_order = dto.display_order;
    if (dto.is_active !== undefined) schema.is_active = dto.is_active;

    return this.metadataSchemaService.save(schema);
  }

  @Delete('schema/:id')
  async deleteSchema(@Param('id', ParseUUIDPipe) id: string) {
    const schema = await this.metadataSchemaService.findOne({ where: { id } });

    if (!schema) {
      throw new NotFoundException(`Field schema with ID ${id} not found`);
    }

    schema.is_active = false;
    await this.metadataSchemaService.save(schema);

    return {
      success: true,
      id,
      message: 'Field schema deactivated (soft delete)',
    };
  }
}
