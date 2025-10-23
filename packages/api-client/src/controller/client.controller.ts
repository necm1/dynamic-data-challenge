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
import { OrmClientService, OrmMetadataEntryService } from '@repo/api-orm';
import { CreateClientDto } from '../dto/create-client.dto';
import { EntityType } from '@repo/shared';
import { UpdateClientDto } from '../dto/update-client.dto';
import { FindClientsDto } from '../dto/find-clients.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Controller('clients')
export class ClientController {
  constructor(
    private readonly clientService: OrmClientService,
    private readonly metadataService: OrmMetadataEntryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async findAll(@Query() dto: FindClientsDto) {
    const { page = 1, perPage = 20, name, email, customFields } = dto;

    return this.clientService.findWithMetadata({
      page,
      perPage,
      name,
      email,
      customFields,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const client = await this.clientService.findOne({
      where: { id },
      isCached: true,
      ttl: 60000,
      cache: {
        id: `client:${id}`,
        milliseconds: 60000,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    const metadata = await this.metadataService.findEntry(
      EntityType.Client,
      id,
    );

    return {
      ...client,
      custom_fields: metadata?.fields || {},
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClientDto) {
    const { name, email, phone, notes, fields } = dto;

    const queryRunner =
      this.clientService.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const client = this.clientService.create({
        name,
        email,
        phone,
        notes,
      });
      const savedClient = await queryRunner.manager.save(client);

      if (fields && Object.keys(fields).length > 0) {
        await queryRunner.manager.save('entity_metadata', {
          entity_type: EntityType.Client,
          entity_id: savedClient.id,
          fields,
        });
      }

      await queryRunner.commitTransaction();

      await this.cacheManager.del('clients:*');

      return {
        ...savedClient,
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
    @Body() dto: UpdateClientDto,
  ) {
    const { name, email, phone, notes, fields } = dto;

    const queryRunner =
      this.clientService.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const coreUpdates: any = {};
      if (name !== undefined) coreUpdates.name = name;
      if (email !== undefined) coreUpdates.email = email;
      if (phone !== undefined) coreUpdates.phone = phone;
      if (notes !== undefined) coreUpdates.notes = notes;

      if (Object.keys(coreUpdates).length > 0) {
        await queryRunner.manager.update('clients', { id }, coreUpdates);
      }

      if (fields !== undefined) {
        const existing = await queryRunner.manager.findOne('entity_metadata', {
          where: {
            entity_type: EntityType.Client,
            entity_id: id,
          },
        });

        if (existing) {
          await queryRunner.manager.update(
            'entity_metadata',
            { entity_type: EntityType.Client, entity_id: id },
            { fields },
          );
        } else if (Object.keys(fields).length > 0) {
          await queryRunner.manager.insert('entity_metadata', {
            entity_type: EntityType.Client,
            entity_id: id,
            fields,
          });
        }
      }

      await queryRunner.commitTransaction();

      const client = await this.clientService.findOne({ where: { id } });
      const metadata = await this.metadataService.findEntry(
        EntityType.Client,
        id,
      );

      await Promise.all([
        this.cacheManager.del(`client:${id}`),
        this.cacheManager.del('clients:*'),
        this.metadataService.cacheManager.del(
          `metadata:${EntityType.Client}:${id}`,
        ),
      ]);

      return {
        ...client,
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
    await this.clientService.delete(id);

    await Promise.all([
      this.cacheManager.del(`client:${id}`),
      this.cacheManager.del('clients:*'),
    ]);
  }
}
