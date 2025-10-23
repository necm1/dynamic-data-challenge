import { Module } from '@nestjs/common';
import { MetadataController } from './controller/metadata.controller';
import { OrmMetadataModule } from '@repo/api-orm';
import { MetadataEntityTypeController } from './controller/metadata-entity-type.controller';

@Module({
  controllers: [MetadataController, MetadataEntityTypeController],
  imports: [OrmMetadataModule],
})
export class MetadataModule {}
