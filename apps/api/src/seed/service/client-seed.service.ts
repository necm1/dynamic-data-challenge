import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EntityType, FieldType } from '@repo/shared';
import { OrmMetadataSchemaService } from '@repo/api-orm';
import { faker } from '@faker-js/faker';

type ClientWithFields = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  customFields: Record<string, any>;
};

@Injectable()
export class ClientSeedService {
  private readonly logger = new Logger(ClientSeedService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private metadataSchemaService: OrmMetadataSchemaService,
  ) {}

  async seed() {
    this.logger.log('Starting client seed...');

    await this.clearData();
    await this.seedFieldSchemas();
    await this.seedClients();

    this.logger.log('Client seed complete!');
  }

  private async clearData() {
    this.logger.log('Clearing existing client data...');

    await this.dataSource.query(
      `DELETE FROM entity_metadata WHERE entity_type = '2'`,
    );
    await this.dataSource.query('DELETE FROM clients');
    await this.dataSource.query(
      `DELETE FROM metadata_schemas WHERE entity_type = '2'`,
    );

    this.logger.log('Client data cleared');
  }

  private async seedFieldSchemas() {
    this.logger.log('Creating client field schemas...');

    const schemas = [
      {
        fieldKey: 'budget_min',
        fieldLabel: 'Minimum Budget',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
        },
        displayOrder: 1,
      },
      {
        fieldKey: 'budget_max',
        fieldLabel: 'Maximum Budget',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
        },
        displayOrder: 2,
      },
      {
        fieldKey: 'preferred_neighborhoods',
        fieldLabel: 'Preferred Neighborhoods',
        fieldType: FieldType.ARRAY,
        validationRules: {
          required: false,
        },
        displayOrder: 3,
      },
      {
        fieldKey: 'client_type',
        fieldLabel: 'Client Type',
        fieldType: FieldType.SELECT,
        validationRules: {
          required: false,
          options: ['Buyer', 'Seller', 'Both', 'Investor', 'Renter'],
        },
        displayOrder: 4,
      },
      {
        fieldKey: 'financing_pre_approved',
        fieldLabel: 'Financing Pre-Approved',
        fieldType: FieldType.BOOLEAN,
        validationRules: {
          required: false,
        },
        displayOrder: 5,
      },
      {
        fieldKey: 'desired_bedrooms',
        fieldLabel: 'Desired Bedrooms',
        fieldType: FieldType.NUMBER,
        validationRules: {
          required: false,
          min: 0,
          max: 10,
        },
        displayOrder: 6,
      },
      {
        fieldKey: 'move_in_timeline',
        fieldLabel: 'Move-in Timeline',
        fieldType: FieldType.SELECT,
        validationRules: {
          required: false,
          options: [
            'ASAP',
            '1-3 months',
            '3-6 months',
            '6-12 months',
            'Flexible',
          ],
        },
        displayOrder: 7,
      },
      {
        fieldKey: 'referral_source',
        fieldLabel: 'Referral Source',
        fieldType: FieldType.TEXT,
        validationRules: {
          required: false,
        },
        displayOrder: 8,
      },
    ];

    for (const schema of schemas) {
      await this.metadataSchemaService.createSchema(
        EntityType.Client,
        schema.fieldKey,
        schema.fieldType,
        {
          fieldLabel: schema.fieldLabel,
          validationRules: schema.validationRules,
          displayOrder: schema.displayOrder,
        },
      );
    }

    this.logger.log(`Created ${schemas.length} client field schemas`);
  }

  private async seedClients() {
    this.logger.log('Creating 10,000 clients...');

    const clientData = this.generateClientData();
    const batchSize = 100;

    for (let i = 0; i < clientData.length; i += batchSize) {
      const batch = clientData.slice(i, i + batchSize);

      for (const data of batch) {
        const result = await this.dataSource
          .createQueryBuilder()
          .insert()
          .into('clients')
          .values({
            name: data.name,
            email: data.email,
            phone: data.phone,
            notes: data.notes,
          })
          .returning('id')
          .execute();

        const clientId = result.raw[0].id;

        if (data.customFields && Object.keys(data.customFields).length > 0) {
          await this.dataSource.query(
            `INSERT INTO entity_metadata (entity_type, entity_id, fields) 
             VALUES ('2', $1, $2)`,
            [clientId, JSON.stringify(data.customFields)],
          );
        }
      }

      this.logger.log(
        `Progress: ${Math.min(i + batchSize, clientData.length)}/${clientData.length}`,
      );
    }

    this.logger.log(`Created ${clientData.length} clients with metadata`);
  }

  private generateClientData(): ClientWithFields[] {
    const clients: ClientWithFields[] = [];

    for (let i = 0; i < 10000; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      clients.push({
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.datatype.boolean({ probability: 0.8 })
          ? faker.phone.number()
          : undefined,
        notes: faker.datatype.boolean({ probability: 0.3 })
          ? faker.lorem.sentence()
          : undefined,
        customFields: this.generateRandomCustomFields(),
      });
    }

    return clients;
  }

  private generateRandomCustomFields(): Record<string, any> {
    const fields: Record<string, any> = {};

    const clientType = faker.helpers.arrayElement([
      'Buyer',
      'Seller',
      'Both',
      'Investor',
      'Renter',
    ]);
    fields.client_type = clientType;

    if (
      clientType === 'Buyer' ||
      clientType === 'Both' ||
      clientType === 'Investor'
    ) {
      const budgetMin = faker.number.int({ min: 200000, max: 800000 });
      const budgetMax = faker.number.int({
        min: budgetMin + 100000,
        max: 2500000,
      });
      fields.budget_min = budgetMin;
      fields.budget_max = budgetMax;

      fields.financing_pre_approved = faker.datatype.boolean({
        probability: 0.6,
      });
    }

    if (faker.datatype.boolean({ probability: 0.7 })) {
      const neighborhoods = [
        'Downtown',
        'Beach',
        'Suburbs',
        'Uptown',
        'Historic District',
      ];
      const numNeighborhoods = faker.number.int({ min: 1, max: 3 });
      fields.preferred_neighborhoods = faker.helpers.arrayElements(
        neighborhoods,
        numNeighborhoods,
      );
    }

    if (faker.datatype.boolean({ probability: 0.8 })) {
      fields.desired_bedrooms = faker.number.int({ min: 1, max: 5 });
    }

    if (faker.datatype.boolean({ probability: 0.7 })) {
      fields.move_in_timeline = faker.helpers.arrayElement([
        'ASAP',
        '1-3 months',
        '3-6 months',
        '6-12 months',
        'Flexible',
      ]);
    }

    if (faker.datatype.boolean({ probability: 0.5 })) {
      const sources = [
        'Website',
        'Referral from friend',
        'Social Media',
        'Walk-in',
        'Previous client',
      ];
      fields.referral_source = faker.helpers.arrayElement(sources);
    }

    return fields;
  }
}
