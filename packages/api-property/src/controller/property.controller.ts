import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Delete,
  Put,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { OrmPropertyService, OrmMetadataEntryService } from '@repo/api-orm';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { EntityType } from '@repo/shared';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { FindPropertiesDto } from '../dto/find-properties.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: OrmPropertyService,
    private readonly metadataService: OrmMetadataEntryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async findAll(@Query() dto: FindPropertiesDto) {
    const {
      page = 1,
      perPage = 20,
      title,
      minPrice,
      maxPrice,
      customFields,
    } = dto;

    return this.propertyService.findWithMetadata({
      page,
      perPage,
      title,
      minPrice,
      maxPrice,
      customFields,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const property = await this.propertyService.findOne({
      where: { id },
      isCached: true,
      ttl: 60000,
      cache: {
        id: `property:${id}`,
        milliseconds: 60000,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    const metadata = await this.metadataService.findEntry(
      EntityType.Property,
      id,
    );

    return {
      ...property,
      custom_fields: metadata?.fields || {},
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePropertyDto) {
    const { title, address, price, year_built, fields } = dto;

    const queryRunner =
      this.propertyService.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const property = this.propertyService.create({
        title,
        address,
        price,
        year_built,
      });
      const savedProperty = await queryRunner.manager.save(property);

      if (fields && Object.keys(fields).length > 0) {
        await queryRunner.manager.save('entity_metadata', {
          entity_type: EntityType.Property,
          entity_id: savedProperty.id,
          fields,
        });
      }

      await queryRunner.commitTransaction();

      await this.cacheManager.del('properties:*');

      return {
        ...savedProperty,
        custom_fields: fields || {},
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    const { title, address, price, year_built, fields } = dto;

    const queryRunner =
      this.propertyService.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const coreUpdates: any = {};
      if (title !== undefined) coreUpdates.title = title;
      if (address !== undefined) coreUpdates.address = address;
      if (price !== undefined) coreUpdates.price = price;
      if (year_built !== undefined) coreUpdates.year_built = year_built;

      if (Object.keys(coreUpdates).length > 0) {
        await queryRunner.manager.update('properties', { id }, coreUpdates);
      }

      if (fields !== undefined) {
        const existing = await queryRunner.manager.findOne('entity_metadata', {
          where: {
            entity_type: EntityType.Property,
            entity_id: id,
          },
        });

        if (existing) {
          await queryRunner.manager.update(
            'entity_metadata',
            { entity_type: EntityType.Property, entity_id: id },
            { fields },
          );
        } else if (Object.keys(fields).length > 0) {
          await queryRunner.manager.insert('entity_metadata', {
            entity_type: EntityType.Property,
            entity_id: id,
            fields,
          });
        }
      }

      await queryRunner.commitTransaction();

      const property = await this.propertyService.findOne({ where: { id } });
      const metadata = await this.metadataService.findEntry(
        EntityType.Property,
        id,
      );

      await Promise.all([
        this.cacheManager.del(`property:${id}`),
        this.cacheManager.del('properties:*'),
      ]);

      return {
        ...property,
        custom_fields: metadata?.fields || {},
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.propertyService.delete(id);

    await Promise.all([
      this.cacheManager.del(`property:${id}`),
      this.cacheManager.del('properties:*'),
    ]);
  }
}
