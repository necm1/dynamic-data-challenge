import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBaseStructure1761254621003 implements MigrationInterface {
  name = 'AddBaseStructure1761254621003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "properties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(160) NOT NULL, "address" character varying(240) NOT NULL, "price" integer NOT NULL, "year_built" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2d83bfa0b9fcd45dee1785af44d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f67846300361680f5f0d53ac3" ON "properties" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2fd1bae8559fceb2dc9eea7bd6" ON "properties" ("price") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."metadata_schemas_entity_type_enum" AS ENUM('0', '1', '2')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."metadata_schemas_field_type_enum" AS ENUM('TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'STRING', 'ARRAY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "metadata_schemas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_type" "public"."metadata_schemas_entity_type_enum" NOT NULL DEFAULT '0', "field_key" character varying(100) NOT NULL, "field_label" character varying(160), "field_type" "public"."metadata_schemas_field_type_enum" NOT NULL, "validation_rules" jsonb, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_204cf456ec04dbcf6ecdd43565a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9fd450ec399b4532efe0c12dc5" ON "metadata_schemas" ("entity_type", "field_key") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."entity_metadata_entity_type_enum" AS ENUM('0', '1', '2')`,
    );
    await queryRunner.query(
      `CREATE TABLE "entity_metadata" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_type" "public"."entity_metadata_entity_type_enum" NOT NULL DEFAULT '0', "entity_id" uuid NOT NULL, "fields" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_079ca28957a6f5a7d5c6ddd3548" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_entity_metadata_entity_unique" ON "entity_metadata" ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listings_status_enum" AS ENUM('0', '1', '2')`,
    );
    await queryRunner.query(
      `CREATE TABLE "listings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."listings_status_enum" NOT NULL DEFAULT '0', "price" numeric(10,2) NOT NULL, "property_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_520ecac6c99ec90bcf5a603cdcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a65b771bc8228047f2f78a091" ON "listings" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b34c1cab63d37419e58c8d406" ON "listings" ("price") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9eef913a9013d6e3d09a92ec07" ON "listings" ("property_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(160) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(50), "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99e921caf21faa2aab020476e4" ON "clients" ("name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD CONSTRAINT "FK_9eef913a9013d6e3d09a92ec075" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listings" DROP CONSTRAINT "FK_9eef913a9013d6e3d09a92ec075"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99e921caf21faa2aab020476e4"`,
    );
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9eef913a9013d6e3d09a92ec07"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b34c1cab63d37419e58c8d406"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a65b771bc8228047f2f78a091"`,
    );
    await queryRunner.query(`DROP TABLE "listings"`);
    await queryRunner.query(`DROP TYPE "public"."listings_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."ux_entity_metadata_entity_unique"`,
    );
    await queryRunner.query(`DROP TABLE "entity_metadata"`);
    await queryRunner.query(
      `DROP TYPE "public"."entity_metadata_entity_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9fd450ec399b4532efe0c12dc5"`,
    );
    await queryRunner.query(`DROP TABLE "metadata_schemas"`);
    await queryRunner.query(
      `DROP TYPE "public"."metadata_schemas_field_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."metadata_schemas_entity_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2fd1bae8559fceb2dc9eea7bd6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f67846300361680f5f0d53ac3"`,
    );
    await queryRunner.query(`DROP TABLE "properties"`);
  }
}
