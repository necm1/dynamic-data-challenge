import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Listing } from '../entity/listing.entity';
import { EntityType, ListingStatus } from '@repo/shared';

interface ListingQueryOptions {
  page?: number;
  perPage?: number;
  status?: ListingStatus;
  minPrice?: number;
  maxPrice?: number;
  property_id?: string;
  customFields?: Record<string, any>;
}

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

  public async findWithMetadata(options: ListingQueryOptions) {
    const page = options.page || 1;
    const perPage = options.perPage || 20;

    const qb = this.buildBaseQuery();

    this.applyStaticFilters(qb, options);
    this.applyCustomFieldFilters(qb, options);

    qb.orderBy('listing.created_at', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [items, total] = await qb
      .cache(`listings:${JSON.stringify(options)}`, 30000)
      .getManyAndCount();

    const totalPages = Math.ceil(total / perPage);

    return {
      data: items.map((item: any) => this.transformListingWithMetadata(item)),
      meta: { total, page, perPage, totalPages },
      links: this.buildPaginationLinks(page, perPage, totalPages),
    };
  }

  private buildBaseQuery(): SelectQueryBuilder<Listing> {
    return this.createQueryBuilder('listing')
      .leftJoinAndSelect('listing.property', 'property')
      .leftJoinAndMapOne(
        'listing.metadata',
        'entity_metadata',
        'metadata',
        'metadata.entity_type = :entityType AND metadata.entity_id = listing.id',
        { entityType: EntityType.Listing },
      );
  }

  private applyStaticFilters(
    qb: SelectQueryBuilder<Listing>,
    options: ListingQueryOptions,
  ): void {
    if (options.status !== undefined) {
      qb.andWhere('listing.status = :status', {
        status: options.status,
      });
    }

    if (options.minPrice !== undefined) {
      qb.andWhere('listing.price >= :minPrice', {
        minPrice: options.minPrice,
      });
    }

    if (options.maxPrice !== undefined) {
      qb.andWhere('listing.price <= :maxPrice', {
        maxPrice: options.maxPrice,
      });
    }

    if (options.property_id) {
      qb.andWhere('listing.property_id = :property_id', {
        property_id: options.property_id,
      });
    }
  }

  private applyCustomFieldFilters(
    qb: SelectQueryBuilder<Listing>,
    options: ListingQueryOptions,
  ): void {
    if (
      !options.customFields ||
      Object.keys(options.customFields).length === 0
    ) {
      return;
    }

    Object.entries(options.customFields).forEach(([key, value]) => {
      const paramName = `custom_${key}`;
      qb.andWhere(`metadata.fields @> :${paramName}`, {
        [paramName]: JSON.stringify({ [key]: value }),
      });
    });
  }

  public transformListingWithMetadata(item: any): any {
    const { metadata, ...listing } = item;
    return {
      ...listing,
      metadata: metadata?.fields || {},
    };
  }

  private buildPaginationLinks(
    page: number,
    perPage: number,
    totalPages: number,
  ) {
    return {
      first: `/listings?page=1&perPage=${perPage}`,
      prev: page > 1 ? `/listings?page=${page - 1}&perPage=${perPage}` : null,
      next:
        page < totalPages
          ? `/listings?page=${page + 1}&perPage=${perPage}`
          : null,
      last: `/listings?page=${totalPages}&perPage=${perPage}`,
    };
  }
}
