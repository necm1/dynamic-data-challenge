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
import { OrmListingService, OrmMetadataEntryService } from '@repo/api-orm';
import { CreateListingDto } from '../dto/create-listing.dto';
import { EntityType } from '@repo/shared';
import { UpdateListingDto } from '../dto/update-listing.dto';
import { FindListingsDto } from '../dto/find-listings.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Controller('listings')
export class ListingController {
  constructor(
    private readonly listingService: OrmListingService,
    private readonly metadataService: OrmMetadataEntryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async findAll(@Query() dto: FindListingsDto) {
    const {
      page = 1,
      perPage = 20,
      status,
      minPrice,
      maxPrice,
      property_id,
      customFields,
    } = dto;

    return this.listingService.findWithMetadata({
      page,
      perPage,
      status,
      minPrice,
      maxPrice,
      property_id,
      customFields,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.listingService.findOne({
      where: { id },
      relations: ['property'],
      isCached: true,
      ttl: 60000,
      cache: {
        id: `listing:${id}`,
        milliseconds: 60000,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    const metadata = await this.metadataService.findEntry(
      EntityType.Listing,
      id,
    );

    return {
      ...listing,
      custom_fields: metadata?.fields || {},
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateListingDto) {
    const { status, price, property_id, fields } = dto;

    const queryRunner =
      this.listingService.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const listing = this.listingService.create({
        status,
        price,
        property_id,
      });
      const savedListing = await queryRunner.manager.save(listing);

      if (fields && Object.keys(fields).length > 0) {
        await queryRunner.manager.save('entity_metadata', {
          entity_type: EntityType.Listing,
          entity_id: savedListing.id,
          fields,
        });
      }

      await queryRunner.commitTransaction();

      await this.cacheManager.del('listings:*');

      return {
        ...savedListing,
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
    @Body() dto: UpdateListingDto,
  ) {
    const { status, price, property_id, fields } = dto;

    const queryRunner =
      this.listingService.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const coreUpdates: any = {};
      if (status !== undefined) coreUpdates.status = status;
      if (price !== undefined) coreUpdates.price = price;
      if (property_id !== undefined) coreUpdates.property_id = property_id;

      if (Object.keys(coreUpdates).length > 0) {
        await queryRunner.manager.update('listings', { id }, coreUpdates);
      }

      if (fields !== undefined) {
        const existing = await queryRunner.manager.findOne('entity_metadata', {
          where: {
            entity_type: EntityType.Listing,
            entity_id: id,
          },
        });

        if (existing) {
          await queryRunner.manager.update(
            'entity_metadata',
            { entity_type: EntityType.Listing, entity_id: id },
            { fields },
          );
        } else if (Object.keys(fields).length > 0) {
          await queryRunner.manager.insert('entity_metadata', {
            entity_type: EntityType.Listing,
            entity_id: id,
            fields,
          });
        }
      }

      await queryRunner.commitTransaction();

      const listing = await this.listingService.findOne({
        where: { id },
        relations: ['property'],
      });
      const metadata = await this.metadataService.findEntry(
        EntityType.Listing,
        id,
      );

      await Promise.all([
        this.cacheManager.del(`listing:${id}`),
        this.cacheManager.del('listings:*'),
      ]);

      return {
        ...listing,
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
    await this.listingService.delete(id);

    await Promise.all([
      this.cacheManager.del(`listing:${id}`),
      this.cacheManager.del('listings:*'),
    ]);
  }
}
