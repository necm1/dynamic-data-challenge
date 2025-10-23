import { Module } from '@nestjs/common';
import { MetadataEntry } from './entity/metadata-entry.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmMetadataEntryService } from './service/metadata-entry.service';
import { OrmMetadataSchemaService } from './service/metadata-schema.service';
import { MetadataSchema } from './entity/metadata-schema.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetadataEntry, MetadataSchema])],
  providers: [OrmMetadataEntryService, OrmMetadataSchemaService],
  exports: [OrmMetadataEntryService, OrmMetadataSchemaService],
})
export class OrmMetadataModule {}
