import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClients1761126817161 implements MigrationInterface {
    name = 'AddClients1761126817161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(160) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(50), "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_99e921caf21faa2aab020476e4" ON "clients" ("name") `);
        await queryRunner.query(`ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "entity_metadata" ALTER COLUMN "fields" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99e921caf21faa2aab020476e4"`);
        await queryRunner.query(`DROP TABLE "clients"`);
    }

}
