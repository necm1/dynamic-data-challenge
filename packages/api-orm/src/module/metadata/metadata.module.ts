import { Module } from '@nestjs/common';
import { MetadataEntry } from './entity/metadata-entry.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MetadataEntry])],
})
export class OrmMetadataModule {}
