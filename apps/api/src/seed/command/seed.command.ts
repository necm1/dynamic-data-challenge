import { Command, CommandRunner } from 'nest-commander';
import { PropertySeedService } from '../service/property-seed.service';

@Command({
  name: 'seed',
  description: 'Seed database with sample data',
})
export class SeedCommand extends CommandRunner {
  constructor(private readonly propertySeed: PropertySeedService) {
    super();
  }

  async run(): Promise<void> {
    console.log('Starting database seed...\n');

    try {
      await this.propertySeed.seed();
      console.log('\nSeed completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\nSeed failed:', error);
      process.exit(1);
    }
  }
}
