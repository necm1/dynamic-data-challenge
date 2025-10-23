import { SeedModule } from './seed.module';
import { NestFactory } from '@nestjs/core';
import { PropertySeedService } from './service/property-seed.service';
import { ListingSeedService } from './service/listing-seed.service';
import { ClientSeedService } from './service/client-seed.service';

(async () => {
  console.log('Starting database seed...\n');

  try {
    const app = await NestFactory.createApplicationContext(SeedModule, {
      logger: ['error', 'warn', 'log'],
    });

    const propertySeedService = app.get(PropertySeedService);
    await propertySeedService.seed();

    const listingSeedService = app.get(ListingSeedService);
    await listingSeedService.seed();

    const clientSeedService = app.get(ClientSeedService);
    await clientSeedService.seed();

    await app.close();

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\nSeed failed:', error);
    process.exit(1);
  }
})().catch((error) => {
  console.error('Unexpected error during seeding:', error);
  process.exit(1);
});
