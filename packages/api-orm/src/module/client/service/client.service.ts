import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/api-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Client } from '../entity/client.entity';
import { EntityType } from '@repo/shared';

interface ClientQueryOptions {
  page?: number;
  perPage?: number;
  name?: string;
  email?: string;
  customFields?: Record<string, any>;
}

@Injectable()
export class OrmClientService extends BaseRepository<Client> {
  constructor(
    @InjectRepository(Client)
    public clientRepository: Repository<Client>,
  ) {
    super(
      clientRepository.target,
      clientRepository.manager,
      clientRepository.queryRunner,
    );
  }

  public async findWithMetadata(options: ClientQueryOptions) {
    const page = options.page || 1;
    const perPage = options.perPage || 20;

    const qb = this.buildBaseQuery();

    this.applyStaticFilters(qb, options);
    this.applyCustomFieldFilters(qb, options);

    qb.orderBy('client.created_at', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [items, total] = await qb
      .cache(`clients:${JSON.stringify(options)}`, 30000)
      .getManyAndCount();

    const totalPages = Math.ceil(total / perPage);

    return {
      data: items.map((item: any) => this.transformClientWithMetadata(item)),
      meta: { total, page, perPage, totalPages },
      links: this.buildPaginationLinks(page, perPage, totalPages),
    };
  }

  private buildBaseQuery(): SelectQueryBuilder<Client> {
    return this.createQueryBuilder('client').leftJoinAndMapOne(
      'client.metadata',
      'entity_metadata',
      'metadata',
      'metadata.entity_type = :entityType AND metadata.entity_id = client.id',
      { entityType: EntityType.Client },
    );
  }

  private applyStaticFilters(
    qb: SelectQueryBuilder<Client>,
    options: ClientQueryOptions,
  ): void {
    if (options.name) {
      qb.andWhere('client.name ILIKE :name', {
        name: `%${options.name}%`,
      });
    }

    if (options.email) {
      qb.andWhere('client.email ILIKE :email', {
        email: `%${options.email}%`,
      });
    }
  }

  private applyCustomFieldFilters(
    qb: SelectQueryBuilder<Client>,
    options: ClientQueryOptions,
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

  public transformClientWithMetadata(item: any): any {
    const { metadata, ...client } = item;
    return {
      ...client,
      custom_fields: metadata?.fields || {},
    };
  }

  private buildPaginationLinks(
    page: number,
    perPage: number,
    totalPages: number,
  ) {
    return {
      first: `/clients?page=1&perPage=${perPage}`,
      prev: page > 1 ? `/clients?page=${page - 1}&perPage=${perPage}` : null,
      next:
        page < totalPages
          ? `/clients?page=${page + 1}&perPage=${perPage}`
          : null,
      last: `/clients?page=${totalPages}&perPage=${perPage}`,
    };
  }
}
