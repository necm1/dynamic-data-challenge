import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorTypes1760908392043 implements MigrationInterface {
  name = 'RefactorTypes1760908392043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_entity_metadata_fields_gin"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."metadata_schemas_field_type_enum" RENAME TO "metadata_schemas_field_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."metadata_schemas_field_type_enum" AS ENUM('TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'STRING', 'ARRAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "metadata_schemas" ALTER COLUMN "field_type" TYPE "public"."metadata_schemas_field_type_enum" USING "field_type"::"text"::"public"."metadata_schemas_field_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."metadata_schemas_field_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."metadata_schemas_field_type_enum" RENAME TO "metadata_schemas_field_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."metadata_schemas_field_type_enum" AS ENUM('TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'STRING', 'ARRAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "metadata_schemas" ALTER COLUMN "field_type" TYPE "public"."metadata_schemas_field_type_enum" USING "field_type"::"text"::"public"."metadata_schemas_field_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."metadata_schemas_field_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."metadata_schemas_field_type_enum_old" AS ENUM('0', '1', '2', '3', '4', '5', '6')`,
    );
    await queryRunner.query(
      `ALTER TABLE "metadata_schemas" ALTER COLUMN "field_type" TYPE "public"."metadata_schemas_field_type_enum_old" USING "field_type"::"text"::"public"."metadata_schemas_field_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."metadata_schemas_field_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."metadata_schemas_field_type_enum_old" RENAME TO "metadata_schemas_field_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."metadata_schemas_field_type_enum_old" AS ENUM('0', '1', '2', '3', '4', '5', '6')`,
    );
    await queryRunner.query(
      `ALTER TABLE "metadata_schemas" ALTER COLUMN "field_type" TYPE "public"."metadata_schemas_field_type_enum_old" USING "field_type"::"text"::"public"."metadata_schemas_field_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."metadata_schemas_field_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."metadata_schemas_field_type_enum_old" RENAME TO "metadata_schemas_field_type_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_entity_metadata_fields_gin" ON "entity_metadata" ("fields") `,
    );
  }
}
