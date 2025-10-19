import { Module } from '@nestjs/common';
import { MetadataEntry } from './entity/metadata-entry.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmMetadataEntryService } from './service/metadata-entry.service';

@Module({
  imports: [TypeOrmModule.forFeature([MetadataEntry])],
  providers: [OrmMetadataEntryService],
  exports: [OrmMetadataEntryService],
})
export class OrmMetadataModule {}
