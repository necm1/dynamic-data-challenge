import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Property } from '../entity/property.entity';
import { PropertyQueryOptions } from '../interface/property-query-options.interface';
import { EntityType } from '@repo/shared';

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

  async findAll(
    page: number,
    perPage: number,
    filters?: {
      title?: string;
      minPrice?: number;
      maxPrice?: number;
      customFields?: Record<string, any>;
    },
  ): Promise<unknown> {
    const qb = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.metadata', 'metadata');

    if (filters?.title) {
      qb.andWhere('property.title ILIKE :title', {
        title: `%${filters.title}%`,
      });
    }

    if (filters?.minPrice) {
      qb.andWhere('property.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice) {
      qb.andWhere('property.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.customFields && Object.keys(filters.customFields).length > 0) {
      qb.andWhere('metadata.fields @> :customFields', {
        customFields: JSON.stringify(filters.customFields),
      });
    }

    const [data, total] = await qb
      .skip((page - 1) * perPage)
      .take(perPage)
      .cache(false)
      .getManyAndCount();

    return {
      status: 200,
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Find properties with metadata and filters
   */
  public async findWithMetadata(options: PropertyQueryOptions) {
    const page = options.page || 1;
    const perPage = options.perPage || 20;

    const qb = this.buildBaseQuery();

    this.applyStaticFilters(qb, options);
    this.applyCustomFieldFilters(qb, options);

    qb.orderBy('property.created_at', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [items, total] = await qb
      .cache(`properties:${JSON.stringify(options)}`, 30000)
      .getManyAndCount();

    const totalPages = Math.ceil(total / perPage);

    return {
      data: items.map((item: any) => this.transformPropertyWithMetadata(item)),
      meta: { total, page, perPage, totalPages },
      links: this.buildPaginationLinks(page, perPage, totalPages),
    };
  }

  /**
   * Build base query with metadata join
   */
  private buildBaseQuery(): SelectQueryBuilder<Property> {
    return this.createQueryBuilder('property').leftJoinAndMapOne(
      'property.metadata',
      'entity_metadata',
      'metadata',
      'metadata.entity_type = :entityType AND metadata.entity_id = property.id',
      { entityType: EntityType.Property },
    );
  }

  /**
   * Apply static field filters (price, title)
   */
  private applyStaticFilters(
    qb: SelectQueryBuilder<Property>,
    options: PropertyQueryOptions,
  ): void {
    if (options.minPrice !== undefined) {
      qb.andWhere('property.price >= :minPrice', {
        minPrice: options.minPrice,
      });
    }

    if (options.maxPrice !== undefined) {
      qb.andWhere('property.price <= :maxPrice', {
        maxPrice: options.maxPrice,
      });
    }

    if (options.title) {
      qb.andWhere('property.title ILIKE :title', {
        title: `%${options.title}%`,
      });
    }
  }

  /**
   * Apply JSONB custom field filters
   */
  private applyCustomFieldFilters(
    qb: SelectQueryBuilder<Property>,
    options: PropertyQueryOptions,
  ): void {
    if (
      !options.customFields ||
      Object.keys(options.customFields).length === 0
    ) {
      return;
    }

    Object.entries(options.customFields).forEach(([key, value]) => {
      this.applyCustomFieldFilter(qb, key, value);
    });
  }

  /**
   * Apply single custom field filter
   */
  private applyCustomFieldFilter(
    qb: SelectQueryBuilder<Property>,
    key: string,
    value: any,
  ): void {
    // Range queries: { gte: 2000, lte: 5000 }
    if (this.isRangeFilter(value)) {
      this.applyRangeFilter(qb, key, value);
      return;
    }

    // Array filter: { in: ['A+', 'A'] }
    if (this.isArrayFilter(value)) {
      this.applyArrayFilter(qb, key, value.in);
      return;
    }

    // Exact match: "A+"
    this.applyExactMatchFilter(qb, key, value);
  }

  /**
   * Apply range filter (gte, lte, gt, lt)
   */
  private applyRangeFilter(
    qb: SelectQueryBuilder<Property>,
    key: string,
    value: any,
  ): void {
    if ('gte' in value) {
      qb.andWhere(`(metadata.fields->>'${key}')::numeric >= :${key}_gte`, {
        [`${key}_gte`]: value.gte,
      });
    }

    if ('lte' in value) {
      qb.andWhere(`(metadata.fields->>'${key}')::numeric <= :${key}_lte`, {
        [`${key}_lte`]: value.lte,
      });
    }

    if ('gt' in value) {
      qb.andWhere(`(metadata.fields->>'${key}')::numeric > :${key}_gt`, {
        [`${key}_gt`]: value.gt,
      });
    }

    if ('lt' in value) {
      qb.andWhere(`(metadata.fields->>'${key}')::numeric < :${key}_lt`, {
        [`${key}_lt`]: value.lt,
      });
    }
  }

  /**
   * Apply array filter (IN operator)
   */
  private applyArrayFilter(
    qb: SelectQueryBuilder<Property>,
    key: string,
    values: any[],
  ): void {
    qb.andWhere(`metadata.fields->>'${key}' = ANY(:${key}_in)`, {
      [`${key}_in`]: values,
    });
  }

  /**
   * Apply exact match filter using JSONB containment (@>)
   */
  private applyExactMatchFilter(
    qb: SelectQueryBuilder<Property>,
    key: string,
    value: any,
  ): void {
    qb.andWhere(`metadata.fields @> :${key}_exact`, {
      [`${key}_exact`]: JSON.stringify({ [key]: value }),
    });
  }

  /**
   * Check if value is a range filter
   */
  private isRangeFilter(value: any): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      ('gte' in value || 'lte' in value || 'gt' in value || 'lt' in value)
    );
  }

  /**
   * Check if value is an array filter
   */
  private isArrayFilter(value: any): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      'in' in value &&
      Array.isArray(value.in)
    );
  }

  /**
   * Transform property entity to include custom_fields
   */
  private transformPropertyWithMetadata(item: any): Record<string, any> {
    return {
      id: item.id,
      title: item.title,
      address: item.address,
      price: item.price,
      year_built: item.year_built,
      created_at: item.created_at,
      updated_at: item.updated_at,
      custom_fields: item.metadata?.fields || {},
    };
  }

  private buildPaginationLinks(
    page: number,
    perPage: number,
    totalPages: number,
  ): Record<string, string> {
    return {
      first: `?page=1&perPage=${perPage}`,
      last: `?page=${totalPages}&perPage=${perPage}`,
      prev: page > 1 ? `?page=${page - 1}&perPage=${perPage}` : '',
      next: page < totalPages ? `?page=${page + 1}&perPage=${perPage}` : '',
    };
  }
}
