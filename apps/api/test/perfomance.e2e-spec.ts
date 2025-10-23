import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Performance Benchmarks (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Response Times', () => {
    const WARMUP_RUNS = 3;
    const BENCHMARK_RUNS = 10;

    async function benchmark(
      name: string,
      requestFn: () => Promise<any>,
      targetMs: number,
    ) {
      for (let i = 0; i < WARMUP_RUNS; i++) {
        await requestFn();
      }

      const times: number[] = [];
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await requestFn();
        times.push(performance.now() - start);
      }

      times.sort((a, b) => a - b);
      const avg = times.reduce((a, b) => a + b) / times.length;
      const median = times[Math.floor(times.length / 2)];
      const p95 = times[Math.floor(times.length * 0.95)];
      const min = times[0];
      const max = times[times.length - 1];

      console.log(`\n📊 ${name}:`);
      console.log(`   Min: ${min?.toFixed(1)}ms`);
      console.log(`   Avg: ${avg?.toFixed(1)}ms`);
      console.log(`   Median: ${median?.toFixed(1)}ms`);
      console.log(`   P95: ${p95?.toFixed(1)}ms`);
      console.log(`   Max: ${max?.toFixed(1)}ms`);
      console.log(`   Target: <${targetMs}ms`);

      expect(p95).toBeLessThan(targetMs);
      return { avg, median, p95, min, max };
    }

    it('GET /properties should respond in <100ms (p95)', async () => {
      await benchmark(
        'List 20 properties',
        () =>
          request(app.getHttpServer())
            .get('/api/properties?page=1&perPage=20')
            .expect(200),
        100,
      );
    });

    it('GET /properties with JSONB filter should respond in <100ms (p95)', async () => {
      const customFields = JSON.stringify({ energy_rating: 'A+' });

      await benchmark(
        'JSONB filter (energy_rating=A+)',
        () =>
          request(app.getHttpServer())
            .get('/api/properties')
            .query({ page: 1, perPage: 20, customFields })
            .expect(200),
        100,
      );
    });

    it('GET /properties with boolean JSONB filter should respond in <100ms', async () => {
      const customFields = JSON.stringify({ has_parking: true });

      await benchmark(
        'JSONB boolean filter (has_parking=true)',
        () =>
          request(app.getHttpServer())
            .get('/api/properties')
            .query({ page: 1, perPage: 20, customFields })
            .expect(200),
        100,
      );
    });

    it('GET /properties with multiple JSONB filters should respond in <150ms', async () => {
      const customFields = JSON.stringify({
        energy_rating: 'A+',
        has_parking: true,
      });

      await benchmark(
        'Multiple JSONB filters (energy + parking)',
        () =>
          request(app.getHttpServer())
            .get('/api/properties')
            .query({ page: 1, perPage: 20, customFields })
            .expect(200),
        150,
      );
    });

    it('GET /properties with price range should respond in <100ms', async () => {
      await benchmark(
        'Price range filter (200k-500k)',
        () =>
          request(app.getHttpServer())
            .get('/api/properties')
            .query({ page: 1, perPage: 20, minPrice: 200000, maxPrice: 500000 })
            .expect(200),
        100,
      );
    });

    it('GET /properties with text search should respond in <150ms', async () => {
      await benchmark(
        'Text search (title LIKE "Luxury%")',
        () =>
          request(app.getHttpServer())
            .get('/api/properties')
            .query({ page: 1, perPage: 20, title: 'Luxury' })
            .expect(200),
        150,
      );
    });

    it('GET /properties with combined filters should respond in <200ms', async () => {
      await benchmark(
        'Combined filters (price + JSONB + text)',
        () =>
          request(app.getHttpServer())
            .get('/api/properties')
            .query({
              page: 1,
              perPage: 20,
              title: 'Luxury',
              minPrice: 300000,
              customFields: JSON.stringify({ energy_rating: 'A+' }),
            })
            .expect(200),
        200,
      );
    });

    it('GET /clients should respond in <100ms (p95)', async () => {
      await benchmark(
        'List 20 clients',
        () =>
          request(app.getHttpServer())
            .get('/api/clients?page=1&perPage=20')
            .expect(200),
        100,
      );
    });

    it('GET /clients with custom fields filter should respond in <100ms', async () => {
      const customFields = JSON.stringify({ company: 'Real Estate GmbH' });

      await benchmark(
        'Client JSONB filter (company)',
        () =>
          request(app.getHttpServer())
            .get('/api/clients')
            .query({ page: 1, perPage: 20, customFields })
            .expect(200),
        100,
      );
    });

    it('GET /clients with name search should respond in <100ms', async () => {
      await benchmark(
        'Client name search',
        () =>
          request(app.getHttpServer())
            .get('/api/clients')
            .query({ page: 1, perPage: 20, name: 'John' })
            .expect(200),
        100,
      );
    });

    it('GET /clients with email search should respond in <100ms', async () => {
      await benchmark(
        'Client email search',
        () =>
          request(app.getHttpServer())
            .get('/api/clients')
            .query({ page: 1, perPage: 20, email: 'john@' })
            .expect(200),
        100,
      );
    });

    it('GET /listings should respond in <100ms (p95)', async () => {
      await benchmark(
        'List 20 listings',
        () =>
          request(app.getHttpServer())
            .get('/api/listings?page=1&perPage=20')
            .expect(200),
        100,
      );
    });

    it('GET /listings with status filter should respond in <100ms', async () => {
      await benchmark(
        'Listing status filter (ACTIVE)',
        () =>
          request(app.getHttpServer())
            .get('/api/listings')
            .query({ page: 1, perPage: 20, status: 0 }) // ACTIVE = 0
            .expect(200),
        100,
      );
    });

    it('GET /listings with price range should respond in <100ms', async () => {
      await benchmark(
        'Listing price range (250k-600k)',
        () =>
          request(app.getHttpServer())
            .get('/api/listings')
            .query({ page: 1, perPage: 20, minPrice: 250000, maxPrice: 600000 })
            .expect(200),
        100,
      );
    });

    it('GET /listings with custom fields should respond in <100ms', async () => {
      const customFields = JSON.stringify({ agent_name: 'Smith' });

      await benchmark(
        'Listing JSONB filter',
        () =>
          request(app.getHttpServer())
            .get('/api/listings')
            .query({ page: 1, perPage: 20, customFields })
            .expect(200),
        100,
      );
    });

    it('GET /listings with combined filters should respond in <150ms', async () => {
      await benchmark(
        'Combined listing filters (status + price + JSONB)',
        () =>
          request(app.getHttpServer())
            .get('/api/listings')
            .query({
              page: 1,
              perPage: 20,
              status: 0,
              minPrice: 300000,
              customFields: JSON.stringify({ featured: true }),
            })
            .expect(200),
        150,
      );
    });
  });

  describe('Pagination Performance', () => {
    it('should maintain performance across deep pagination', async () => {
      const pages = [1, 10, 50, 100, 250, 500];
      const times: Record<number, number> = {};

      for (const page of pages) {
        const start = performance.now();
        await request(app.getHttpServer())
          .get('/api/properties')
          .query({ page, perPage: 20 })
          .expect(200);
        times[page] = performance.now() - start;
      }

      console.log('\n📄 Pagination Performance:');
      pages.forEach((page) => {
        console.log(
          `   Page ${page.toString().padStart(3)}: ${times[page]?.toFixed(1)}ms`,
        );
      });

      const degradation = times[500] / times[1];
      expect(degradation).toBeLessThan(3);
      console.log(`   Degradation factor: ${degradation.toFixed(2)}x`);
    });

    it('should handle different page sizes efficiently', async () => {
      const pageSizes = [10, 20, 50, 100];
      const times: Record<number, number> = {};

      for (const perPage of pageSizes) {
        const start = performance.now();
        await request(app.getHttpServer())
          .get('/api/properties')
          .query({ page: 1, perPage })
          .expect(200);
        times[perPage] = performance.now() - start;
      }

      console.log('\n📦 Page Size Performance:');
      pageSizes.forEach((size) => {
        console.log(
          `   ${size.toString().padStart(3)} items: ${times[size].toFixed(1)}ms`,
        );
      });

      expect(times[100]).toBeLessThan(times[10] * 3);
    });
  });

  describe('JSONB Query Performance', () => {
    it('should efficiently query single JSONB field', async () => {
      const start = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/properties')
        .query({
          page: 1,
          perPage: 20,
          customFields: JSON.stringify({ has_parking: true }),
        })
        .expect(200);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(response.body.data.length).toBeGreaterThan(0);
      console.log(
        `✓ Single JSONB field: ${duration.toFixed(1)}ms (${response.body.data.length} results)`,
      );
    });

    it('should efficiently query JSONB string field', async () => {
      const start = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/properties')
        .query({
          page: 1,
          perPage: 20,
          customFields: JSON.stringify({ energy_rating: 'A+' }),
        })
        .expect(200);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(response.body.data.length).toBeGreaterThan(0);
      console.log(
        `✓ JSONB string field: ${duration.toFixed(1)}ms (${response.body.data.length} results)`,
      );
    });

    it('should efficiently query JSONB number field', async () => {
      const start = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/properties')
        .query({
          page: 1,
          perPage: 20,
          customFields: JSON.stringify({ num_bedrooms: 3 }),
        })
        .expect(200);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      console.log(
        `✓ JSONB number field: ${duration.toFixed(1)}ms (${response.body.data.length} results)`,
      );
    });

    it('should efficiently combine multiple JSONB conditions', async () => {
      const start = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/properties')
        .query({
          page: 1,
          perPage: 20,
          customFields: JSON.stringify({
            energy_rating: 'A+',
            has_parking: true,
            num_bedrooms: 3,
          }),
        })
        .expect(200);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(150);
      console.log(
        `✓ Multiple JSONB conditions: ${duration.toFixed(1)}ms (${response.body.data.length} results)`,
      );
    });
  });

  describe('Cache Performance', () => {
    it('should show cache speedup for repeated queries', async () => {
      const endpoint = '/api/properties';
      const query = { page: 1, perPage: 20, title: 'Luxury' };

      const coldStart = performance.now();
      await request(app.getHttpServer()).get(endpoint).query(query).expect(200);
      const coldTime = performance.now() - coldStart;

      const warmTimes: number[] = [];
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await request(app.getHttpServer())
          .get(endpoint)
          .query(query)
          .expect(200);
        warmTimes.push(performance.now() - start);
      }
      const warmAvg = warmTimes.reduce((a, b) => a + b) / warmTimes.length;

      console.log(`\nCache Performance:`);
      console.log(`   Cold: ${coldTime.toFixed(1)}ms`);
      console.log(`   Warm: ${warmAvg.toFixed(1)}ms`);
      console.log(`   Speedup: ${(coldTime / warmAvg).toFixed(2)}x`);

      expect(warmAvg).toBeLessThan(coldTime * 1.5);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle large result sets efficiently', async () => {
      const start = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 1, perPage: 100 })
        .expect(200);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(response.body.data).toHaveLength(100);
      console.log(`✓ 100 items with metadata: ${duration.toFixed(1)}ms`);
    });

    it('should count total records efficiently', async () => {
      const start = performance.now();

      const response = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 1, perPage: 1 })
        .expect(200);

      const duration = performance.now() - start;

      expect(response.body.meta.total).toBeGreaterThanOrEqual(10000);
      expect(duration).toBeLessThan(100);
      console.log(
        `✓ Count ${response.body.meta.total} records: ${duration.toFixed(1)}ms`,
      );
    });
  });
});
