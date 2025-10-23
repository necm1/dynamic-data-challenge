import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EntityType, FieldType } from '@repo/shared';
import { OrmMetadataSchemaService, Property } from '@repo/api-orm';
import { faker } from '@faker-js/faker';

type PropertyWithFields = Partial<
  Property & { customFields: Record<string, any> }
>;

@Injectable()
export class PropertySeedService {
  private readonly logger = new Logger(PropertySeedService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private metadataSchemaService: OrmMetadataSchemaService,
  ) {}

  async seed() {
    this.logger.log('Starting property seed...');

    await this.clearData();
    await this.seedFieldSchemas();
    await this.seedProperties();

    this.logger.log('Property seed complete!');
  }

  private async clearData() {
    this.logger.log('Clearing existing data...');

    await this.dataSource.query(
      `DELETE FROM entity_metadata WHERE entity_type = '0'`,
    );
    await this.dataSource.query('DELETE FROM properties');
    await this.dataSource.query(
      `DELETE FROM metadata_schemas WHERE entity_type = '0'`,
    );

    this.logger.log('Data cleared');
  }

  private async seedFieldSchemas() {
    this.logger.log('Creating field schemas...');

    const schemas = [
      {
        fieldKey: 'energy_rating',
        fieldLabel: 'Energy Rating',
        fieldType: FieldType.SELECT,
        validationRules: {
          required: false,
          options: ['A+', 'A', 'B', 'C', 'D', 'E', 'F'],
        },
        displayOrder: 1,
      },
      {
        fieldKey: 'square_footage',
        fieldLabel: 'Square Footage',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 100,
          max: 50000,
        },
        displayOrder: 2,
      },
      {
        fieldKey: 'has_parking',
        fieldLabel: 'Has Parking',
        fieldType: FieldType.BOOLEAN,
        validationRules: {
          required: false,
        },
        displayOrder: 3,
      },
      {
        fieldKey: 'num_bedrooms',
        fieldLabel: 'Number of Bedrooms',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
          max: 20,
        },
        displayOrder: 4,
      },
      {
        fieldKey: 'num_bathrooms',
        fieldLabel: 'Number of Bathrooms',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
          max: 10,
        },
        displayOrder: 5,
      },
      {
        fieldKey: 'year_renovated',
        fieldLabel: 'Year Renovated',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 1900,
          max: new Date().getFullYear(),
        },
        displayOrder: 6,
      },
      {
        fieldKey: 'amenities',
        fieldLabel: 'Amenities',
        fieldType: FieldType.ARRAY,
        validationRules: {
          required: false,
          options: [
            'Pool',
            'Gym',
            'Garden',
            'Garage',
            'Balcony',
            'Terrace',
            'Security',
            'Elevator',
          ],
        },
        displayOrder: 7,
      },
      {
        fieldKey: 'heating_type',
        fieldLabel: 'Heating Type',
        fieldType: FieldType.SELECT,
        validationRules: {
          required: false,
          options: ['Gas', 'Electric', 'Oil', 'Solar', 'Heat Pump', 'None'],
        },
        displayOrder: 8,
      },
      {
        fieldKey: 'internet_speed',
        fieldLabel: 'Internet Speed (Mbps)',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
          max: 10000,
        },
        displayOrder: 9,
      },
      {
        fieldKey: 'pet_friendly',
        fieldLabel: 'Pet Friendly',
        fieldType: FieldType.BOOLEAN,
        validationRules: {
          required: false,
        },
        displayOrder: 10,
      },
    ];

    for (const schema of schemas) {
      await this.metadataSchemaService.createSchema(
        EntityType.Property,
        schema.fieldKey,
        schema.fieldType,
        {
          fieldLabel: schema.fieldLabel,
          validationRules: schema.validationRules,
          displayOrder: schema.displayOrder,
        },
      );
    }

    this.logger.log(`Created ${schemas.length} field schemas`);
  }

  private async seedProperties() {
    this.logger.log('Creating 10,000 properties...');

    const propertyData: PropertyWithFields[] = this.generatePropertyData();
    const batchSize = 100;

    for (let i = 0; i < propertyData.length; i += batchSize) {
      const batch = propertyData.slice(i, i + batchSize);

      for (const data of batch) {
        const result = await this.dataSource
          .createQueryBuilder()
          .insert()
          .into('properties')
          .values({
            title: data.title,
            address: data.address,
            price: data.price,
            year_built: data.year_built,
          })
          .returning('id')
          .execute();

        const propertyId = result.raw[0].id;

        if (data.customFields && Object.keys(data.customFields).length > 0) {
          await this.dataSource.query(
            `INSERT INTO entity_metadata (entity_type, entity_id, fields) 
             VALUES ('0', $1, $2)`,
            [propertyId, JSON.stringify(data.customFields)],
          );
        }
      }

      this.logger.log(
        `Progress: ${Math.min(i + batchSize, propertyData.length)}/10,000`,
      );
    }

    this.logger.log(`Created ${propertyData.length} properties with metadata`);
  }

  private generatePropertyData(): PropertyWithFields[] {
    const propertyTypes = [
      'Luxury Penthouse',
      'Modern Apartment',
      'Cozy Studio',
      'Family Villa',
      'Downtown Loft',
      'Suburban House',
      'Beachfront Condo',
      'Mountain Cabin',
      'Urban Townhouse',
      'Country Estate',
    ];

    const properties: PropertyWithFields[] = [];

    for (let i = 0; i < 10000; i++) {
      const propertyType = faker.helpers.arrayElement(propertyTypes);

      properties.push({
        title: `${propertyType} in ${faker.location.city()}`,
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
        price: faker.number.int({ min: 300000, max: 2500000 }),
        year_built: faker.number.int({ min: 1980, max: 2024 }),
        customFields: this.generateRandomCustomFields(),
      });
    }

    return properties;
  }

  private generateRandomCustomFields(): Record<string, any> {
    const energyRatings = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
    const heatingTypes = [
      'Gas',
      'Electric',
      'Oil',
      'Solar',
      'Heat Pump',
      'None',
    ];
    const amenitiesPool = [
      'Pool',
      'Gym',
      'Garden',
      'Garage',
      'Balcony',
      'Terrace',
      'Security',
      'Elevator',
    ];

    const fields: Record<string, any> = {};

    if (faker.datatype.boolean({ probability: 0.8 })) {
      fields.energy_rating = faker.helpers.arrayElement(energyRatings);
    }

    if (faker.datatype.boolean({ probability: 0.7 })) {
      fields.square_footage = faker.number.int({ min: 500, max: 5000 });
    }

    if (faker.datatype.boolean({ probability: 0.6 })) {
      fields.has_parking = faker.datatype.boolean();
    }

    if (faker.datatype.boolean({ probability: 0.9 })) {
      fields.num_bedrooms = faker.number.int({ min: 1, max: 6 });
    }

    if (faker.datatype.boolean({ probability: 0.9 })) {
      fields.num_bathrooms = faker.number.int({ min: 1, max: 4 });
    }

    if (faker.datatype.boolean({ probability: 0.5 })) {
      fields.year_renovated = faker.number.int({ min: 2000, max: 2024 });
    }

    if (faker.datatype.boolean({ probability: 0.7 })) {
      const numAmenities = faker.number.int({ min: 1, max: 4 });
      fields.amenities = faker.helpers.arrayElements(
        amenitiesPool,
        numAmenities,
      );
    }

    if (faker.datatype.boolean({ probability: 0.6 })) {
      fields.heating_type = faker.helpers.arrayElement(heatingTypes);
    }
    if (faker.datatype.boolean({ probability: 0.4 })) {
      fields.internet_speed = faker.number.int({ min: 50, max: 1000 });
    }

    if (faker.datatype.boolean({ probability: 0.5 })) {
      fields.pet_friendly = faker.datatype.boolean();
    }

    return fields;
  }
}
