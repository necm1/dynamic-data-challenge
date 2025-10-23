import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './entity/listing.entity';
import { OrmListingService } from './service/listing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Listing])],
  providers: [OrmListingService],
  exports: [OrmListingService],
})
export class OrmListingModule {}
