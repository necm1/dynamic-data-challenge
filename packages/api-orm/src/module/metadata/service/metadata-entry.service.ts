import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetadataEntry } from '../entity/metadata-entry.entity';
import { EntityType } from '@repo/shared';

@Injectable()
export class OrmMetadataEntryService extends BaseRepository<MetadataEntry> {
  constructor(
    @InjectRepository(MetadataEntry)
    public metadataEntryRepository: Repository<MetadataEntry>,
  ) {
    super(
      metadataEntryRepository.target,
      metadataEntryRepository.manager,
      metadataEntryRepository.queryRunner,
    );
  }

  public async findEntry(
    entity_type: EntityType,
    entity_id: string,
  ): Promise<MetadataEntry | null> {
    return this.metadataEntryRepository.findOne({
      where: {
        entity_id,
        entity_type,
      },
    });
  }

  public async doUpsert(
    entity_type: EntityType,
    entity_id: string,
    fields: unknown,
  ) {
    const existing = await this.findEntry(entity_type, entity_id);
    if (existing) {
      await this.metadataEntryRepository.update(
        { id: existing.id },
        { fields: fields as any },
      );
      return this.metadataEntryRepository.findOneByOrFail({ id: existing.id });
    }

    const created = this.metadataEntryRepository.create({
      entity_type,
      entity_id,
      fields,
    });

    return this.metadataEntryRepository.save(created);
  }

  public async doRemove(
    entity_type: EntityType,
    entity_id: string,
  ): Promise<boolean> {
    const result = await this.metadataEntryRepository.delete({
      entity_type,
      entity_id,
    });

    return !!result.affected;
  }
}
