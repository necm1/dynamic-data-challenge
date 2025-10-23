import { Module } from '@nestjs/common';
import { OrmListingModule, OrmMetadataModule } from '@repo/api-orm';
import { ListingController } from './controller/listing.controller';

@Module({
  imports: [OrmListingModule, OrmMetadataModule],
  controllers: [ListingController],
})
export class ListingsModule {}
