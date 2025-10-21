import { Module } from '@nestjs/common';
import { PropertyController } from './controller/property.controller';
import { OrmMetadataModule, OrmPropertyModule } from '@repo/api-orm';

@Module({
  controllers: [PropertyController],
  imports: [OrmPropertyModule, OrmMetadataModule],
})
export class PropertyModule {}
