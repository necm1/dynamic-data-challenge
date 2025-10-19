import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../entity/property.entity';

@Injectable()
export class OrmPropertyService extends BaseRepository<Property> {
  constructor(
    @InjectRepository(Property)
    public propertyRepository: Repository<Property>,
  ) {
    super(
      propertyRepository.target,
      propertyRepository.manager,
      propertyRepository.queryRunner,
    );
  }
}
