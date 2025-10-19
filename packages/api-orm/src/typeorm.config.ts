import 'reflect-metadata';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({
  path: resolve(__dirname, `../../../.env.api`),
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [resolve('packages/api-orm/**/*.entity{.ts,.js}')],
  synchronize: false,
  migrationsRun: false,
  logging: true,
  migrations: [resolve('apps/api/src/migrations/**/*{.ts,.js}')],
});
