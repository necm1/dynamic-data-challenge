import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './entity/listing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Listing])],
})
export class OrmListingModule {}
