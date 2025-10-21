import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  ObjectLiteral,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { Pagination } from './pagination.interface';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

interface CacheOptions {
  isCached?: boolean;
  cacheId?: string;
  ttl?: number;
}

interface FindPaginatedOptions<T> extends CacheOptions {
  perPage?: number;
  page?: number;
}

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  @Inject(CACHE_MANAGER) public cacheManager: Cache;

  public override async find({
    isCached = true,
    ttl = 3600 * 1000,
    ...options
  }: FindManyOptions<T> & CacheOptions): Promise<T[]> {
    options = options || {};

    if (isCached) {
      options.cache = {
        id: options.cacheId,
        milliseconds: ttl || 3600 * 1000,
      };
    }

    const result = await super.find(options);

    return result;
  }

  public override async findAndCount({
    isCached = true,
    ttl = 3600 * 1000,
    ...options
  }: FindManyOptions<T> & CacheOptions): Promise<[T[], number]> {
    options = options || {};

    if (isCached) {
      options.cache = {
        id: options.cacheId,
        milliseconds: ttl || 3600 * 1000,
      };
    }

    const result = await super.findAndCount(options);

    return result;
  }

  public override async findOne({
    isCached = true,
    ttl = 3600 * 1000,
    ...options
  }: FindOneOptions<T> & CacheOptions): Promise<T | null> {
    options = options || {};

    if (isCached) {
      options.cache = {
        id: options.cacheId,
        milliseconds: ttl || 3600 * 1000,
      };
    }

    const result = await super.findOne(options);

    return result;
  }

  public override async findOneOrFail({
    isCached = true,
    ttl = 3600 * 1000,
    ...options
  }: FindOneOptions<T> & CacheOptions): Promise<T> {
    options = options || {};

    if (isCached) {
      options.cache = {
        id: options.cacheId,
        milliseconds: ttl || 3600 * 1000,
      };
    }

    return super.findOneOrFail(options);
  }

  public async findPaginated({
    perPage = 10,
    page = 1,
    isCached = true,
    ttl = 3600 * 1000,
    ...options
  }: FindManyOptions<T> & FindPaginatedOptions<T>): Promise<Pagination<T>> {
    options = {
      ...options,
      take: perPage,
      skip: (page - 1) * perPage,
    };

    const [items, total] = await this.findAndCount({
      cacheId: `pagination:${this.metadata.tableName}:${JSON.stringify(
        options,
      )}`,
      isCached,
      ttl,
      ...options,
    });
    const totalPages = Math.ceil(total / perPage);

    const pagination = {
      data: items,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
      links: {
        first: `?page=1&perPage=${perPage}`,
        last: `?page=${totalPages}&perPage=${perPage}`,
        prev: page > 1 ? `?page=${page - 1}&perPage=${perPage}` : '',
        next: page < totalPages ? `?page=${page + 1}&perPage=${perPage}` : '',
      },
    };

    return pagination;
  }

  public async paginateQueryBuilder(
    qb: SelectQueryBuilder<T>,
    options: FindPaginatedOptions<T>,
  ): Promise<Pagination<T>> {
    const {
      perPage = 10,
      page = 1,
      isCached = true,
      ttl = 3600 * 1000,
    } = options;

    qb.skip((page - 1) * perPage).take(perPage);

    let items: T[];
    let total: number;

    if (isCached) {
      const cacheKey = `qb:${qb.getQueryAndParameters()[0]}:p${page}:pp${perPage}`;
      [items, total] = await qb.cache(cacheKey, ttl).getManyAndCount();
    } else {
      [items, total] = await qb.getManyAndCount();
    }

    const totalPages = Math.ceil(total / perPage);

    return {
      data: items,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
      links: {
        first: `?page=1&perPage=${perPage}`,
        last: `?page=${totalPages}&perPage=${perPage}`,
        prev: page > 1 ? `?page=${page - 1}&perPage=${perPage}` : '',
        next: page < totalPages ? `?page=${page + 1}&perPage=${perPage}` : '',
      },
    };
  }

  public async paginateRawQueryBuilder(
    qb: SelectQueryBuilder<any>,
    options: FindPaginatedOptions<any>,
    transform?: (row: any) => any,
  ): Promise<Pagination<any>> {
    const {
      perPage = 10,
      page = 1,
      isCached = true,
      ttl = 3600 * 1000,
    } = options;

    qb.skip((page - 1) * perPage).take(perPage);

    const cacheKey = isCached
      ? `raw:${qb.getQueryAndParameters()[0]}:p${page}:pp${perPage}`
      : undefined;

    const items = isCached
      ? await qb.cache(cacheKey, ttl).getRawMany()
      : await qb.getRawMany();

    const countQb = qb.clone().skip(0).take(undefined);
    const total = await countQb.getCount();

    const totalPages = Math.ceil(total / perPage);

    const data = transform ? items.map(transform) : items;

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
      links: {
        first: `?page=1&perPage=${perPage}`,
        last: `?page=${totalPages}&perPage=${perPage}`,
        prev: page > 1 ? `?page=${page - 1}&perPage=${perPage}` : '',
        next: page < totalPages ? `?page=${page + 1}&perPage=${perPage}` : '',
      },
    };
  }

  public override async save<TInput extends DeepPartial<T>>(
    entities: TInput[],
    options?: SaveOptions & { reload: false },
  ): Promise<(T & Required<T>)[]>;

  public override async save<TInput extends DeepPartial<T>>(
    entity: TInput,
    options?: SaveOptions & { reload: false },
  ): Promise<T & Required<T>>;

  public override async save<TInput extends DeepPartial<T>>(
    entityOrEntities: TInput | TInput[],
    options?: SaveOptions,
  ): Promise<(T & Required<T>) | (T & Required<T>)[]> {
    const result = await super.save(entityOrEntities as any, options);
    await this.resetPaginationCache();
    return result;
  }

  public override async update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    const result = await super.update(criteria, partialEntity);

    if (result.affected) {
      await this.resetPaginationCache();
    }

    return result;
  }

  public async deleteById(
    criteria:
      | string
      | number
      | Date
      | ObjectId
      | string[]
      | number[]
      | Date[]
      | ObjectId[],
  ): Promise<DeleteResult> {
    return await this.delete(criteria);
  }

  private async resetPaginationCache(): Promise<void> {
    const cacheKeys = await this.cacheManager.store.keys(
      `pagination:${this.metadata.tableName}:*`,
    );
    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));
  }
}
