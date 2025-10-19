import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetadataEntry } from '../entity/metadata-entry.entity';

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
}
