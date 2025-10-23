import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrmPropertyService } from '@repo/api-orm';

async function benchmark() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const propertyService = app.get(OrmPropertyService);

  console.log('Starting Performance Benchmark...\n');

  console.time('Query 1: List 20 properties');
  await propertyService.findWithMetadata({ page: 1, perPage: 20 });
  console.timeEnd('Query 1: List 20 properties');

  console.time('Query 2: Filter by custom field');
  await propertyService.findWithMetadata({
    page: 1,
    perPage: 20,
    customFields: { energy_rating: 'A+' },
  });
  console.timeEnd('Query 2: Filter by custom field');

  console.time('Query 3: Price range filter');
  await propertyService.findWithMetadata({
    page: 1,
    perPage: 20,
    minPrice: 200000,
    maxPrice: 500000,
  });
  console.timeEnd('Query 3: Price range filter');

  console.time('Query 4: Combined filters');
  await propertyService.findWithMetadata({
    page: 1,
    perPage: 20,
    title: 'Villa',
    minPrice: 300000,
    customFields: { has_pool: true },
  });
  console.timeEnd('Query 4: Combined filters');

  await app.close();
  console.log('\nBenchmark Complete');
}

benchmark().catch(console.error);
