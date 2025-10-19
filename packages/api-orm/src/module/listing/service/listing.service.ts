import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../entity/listing.entity';

@Injectable()
export class OrmListingService extends BaseRepository<Listing> {
  constructor(
    @InjectRepository(Listing)
    public listingRepository: Repository<Listing>,
  ) {
    super(
      listingRepository.target,
      listingRepository.manager,
      listingRepository.queryRunner,
    );
  }
}
