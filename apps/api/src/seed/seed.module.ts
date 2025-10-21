import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrmModule, OrmMetadataModule } from '@repo/api-orm';
import { PropertySeedService } from './service/property-seed.service';
import { SeedCommand } from './command/seed.command';
import { resolve } from 'path';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        resolve(__dirname, `../../../../.env.api`),
        resolve(__dirname, '../../../../.env'),
      ],
      isGlobal: true,
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      password: process.env.REDIS_PASSWORD,
      ttl: 3600 * 1000,
      isGlobal: true,
    }),
    OrmModule,
    OrmMetadataModule,
  ],
  providers: [PropertySeedService, SeedCommand],
})
export class SeedModule {}
