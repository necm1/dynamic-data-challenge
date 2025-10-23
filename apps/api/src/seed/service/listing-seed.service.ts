import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EntityType, FieldType, ListingStatus } from '@repo/shared';
import { OrmMetadataSchemaService } from '@repo/api-orm';
import { faker } from '@faker-js/faker';

type ListingWithFields = {
  status: ListingStatus;
  price: number;
  property_id: string;
  customFields: Record<string, any>;
};

@Injectable()
export class ListingSeedService {
  private readonly logger = new Logger(ListingSeedService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private metadataSchemaService: OrmMetadataSchemaService,
  ) {}

  async seed() {
    this.logger.log('Starting listing seed...');

    await this.clearData();
    await this.seedFieldSchemas();
    await this.seedListings();

    this.logger.log('Listing seed complete!');
  }

  private async clearData() {
    this.logger.log('Clearing existing listing data...');

    await this.dataSource.query(
      `DELETE FROM entity_metadata WHERE entity_type = '1'`,
    );
    await this.dataSource.query('DELETE FROM listings');
    await this.dataSource.query(
      `DELETE FROM metadata_schemas WHERE entity_type = '1'`,
    );

    this.logger.log('Listing data cleared');
  }

  private async seedFieldSchemas() {
    this.logger.log('Creating listing field schemas...');

    const schemas = [
      {
        fieldKey: 'commission_rate',
        fieldLabel: 'Commission Rate (%)',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
          max: 20,
        },
        displayOrder: 1,
      },
      {
        fieldKey: 'listing_agent',
        fieldLabel: 'Listing Agent',
        fieldType: FieldType.TEXT,
        validationRules: {
          required: false,
        },
        displayOrder: 2,
      },
      {
        fieldKey: 'days_on_market',
        fieldLabel: 'Days on Market',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
        },
        displayOrder: 3,
      },
      {
        fieldKey: 'open_house_dates',
        fieldLabel: 'Open House Dates',
        fieldType: FieldType.ARRAY,
        validationRules: {
          required: false,
        },
        displayOrder: 4,
      },
      {
        fieldKey: 'marketing_channels',
        fieldLabel: 'Marketing Channels',
        fieldType: FieldType.ARRAY,
        validationRules: {
          required: false,
          options: [
            'Website',
            'Social Media',
            'Print',
            'Email',
            'Open House',
            'Referral',
          ],
        },
        displayOrder: 5,
      },
      {
        fieldKey: 'featured_listing',
        fieldLabel: 'Featured Listing',
        fieldType: FieldType.BOOLEAN,
        validationRules: {
          required: false,
        },
        displayOrder: 6,
      },
      {
        fieldKey: 'virtual_tour_url',
        fieldLabel: 'Virtual Tour URL',
        fieldType: FieldType.TEXT,
        validationRules: {
          required: false,
        },
        displayOrder: 7,
      },
      {
        fieldKey: 'showing_instructions',
        fieldLabel: 'Showing Instructions',
        fieldType: FieldType.TEXT,
        validationRules: {
          required: false,
        },
        displayOrder: 8,
      },
    ];

    for (const schema of schemas) {
      await this.metadataSchemaService.createSchema(
        EntityType.Listing,
        schema.fieldKey,
        schema.fieldType,
        {
          fieldLabel: schema.fieldLabel,
          validationRules: schema.validationRules,
          displayOrder: schema.displayOrder,
        },
      );
    }

    this.logger.log(`Created ${schemas.length} listing field schemas`);
  }

  private async seedListings() {
    this.logger.log('Creating listings...');

    const properties = await this.dataSource.query(
      'SELECT id FROM properties LIMIT 10000',
    );

    if (properties.length === 0) {
      this.logger.warn('No properties found! Run property seed first.');
      return;
    }

    const listingData = this.generateListingData(properties);
    const batchSize = 100;

    for (let i = 0; i < listingData.length; i += batchSize) {
      const batch = listingData.slice(i, i + batchSize);

      for (const data of batch) {
        const result = await this.dataSource
          .createQueryBuilder()
          .insert()
          .into('listings')
          .values({
            status: data.status,
            price: data.price,
            property_id: data.property_id,
          })
          .returning('id')
          .execute();

        const listingId = result.raw[0].id;

        if (data.customFields && Object.keys(data.customFields).length > 0) {
          await this.dataSource.query(
            `INSERT INTO entity_metadata (entity_type, entity_id, fields) 
             VALUES ('1', $1, $2)`,
            [listingId, JSON.stringify(data.customFields)],
          );
        }
      }

      this.logger.log(
        `Progress: ${Math.min(i + batchSize, listingData.length)}/${listingData.length}`,
      );
    }

    this.logger.log(`Created ${listingData.length} listings with metadata`);
  }

  private generateListingData(
    properties: Array<{ id: string }>,
  ): ListingWithFields[] {
    const listings: ListingWithFields[] = [];
    const numListings = Math.floor(properties.length * 0.6);

    const selectedProperties = faker.helpers
      .shuffle(properties)
      .slice(0, numListings);

    for (const property of selectedProperties) {
      const status = faker.helpers.arrayElement([
        ListingStatus.ACTIVE,
        ListingStatus.ACTIVE,
        ListingStatus.ACTIVE,
        ListingStatus.PENDING,
        ListingStatus.SOLD,
      ]);

      const basePrice = faker.number.int({ min: 300000, max: 2500000 });
      const priceFactor = status === ListingStatus.SOLD ? 0.95 : 1.0;

      listings.push({
        status,
        price: Math.round(basePrice * priceFactor),
        property_id: property.id,
        customFields: this.generateRandomCustomFields(status),
      });
    }

    return listings;
  }

  private generateRandomCustomFields(
    status: ListingStatus,
  ): Record<string, any> {
    const fields: Record<string, any> = {};

    if (faker.datatype.boolean({ probability: 0.8 })) {
      fields.commission_rate = faker.number.float({
        min: 2.5,
        max: 6.0,
        fractionDigits: 1,
      });
    }

    if (faker.datatype.boolean({ probability: 0.9 })) {
      fields.listing_agent = faker.person.fullName();
    }

    if (status === ListingStatus.ACTIVE || status === ListingStatus.PENDING) {
      fields.days_on_market = faker.number.int({ min: 1, max: 180 });
    }

    if (faker.datatype.boolean({ probability: 0.7 })) {
      const numDates = faker.number.int({ min: 1, max: 3 });
      fields.open_house_dates = Array.from(
        { length: numDates },
        () => faker.date.future({ years: 0.1 }).toISOString().split('T')[0],
      );
    }

    if (faker.datatype.boolean({ probability: 0.8 })) {
      const channels = [
        'Website',
        'Social Media',
        'Print',
        'Email',
        'Open House',
        'Referral',
      ];
      const numChannels = faker.number.int({ min: 2, max: 4 });
      fields.marketing_channels = faker.helpers.arrayElements(
        channels,
        numChannels,
      );
    }

    if (faker.datatype.boolean({ probability: 0.1 })) {
      fields.featured_listing = true;
    }

    if (faker.datatype.boolean({ probability: 0.5 })) {
      fields.virtual_tour_url = `https://virtualtour.example.com/${faker.string.alphanumeric(8)}`;
    }

    if (faker.datatype.boolean({ probability: 0.6 })) {
      const instructions = [
        'Call 24h in advance',
        'Lockbox code: #1234',
        'Occupied - please schedule',
        'Tenant occupied - advance notice required',
        'Easy to show',
      ];
      fields.showing_instructions = faker.helpers.arrayElement(instructions);
    }

    return fields;
  }
}
