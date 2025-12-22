import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebhookStatusToRepo1766062072259 implements MigrationInterface {
    name = 'AddWebhookStatusToRepo1766062072259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."repos_webhookstatus_enum" AS ENUM('PENDING', 'ACTIVE', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "webhookStatus" "public"."repos_webhookstatus_enum" NOT NULL DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "webhookStatus"`);
        await queryRunner.query(`DROP TYPE "public"."repos_webhookstatus_enum"`);
    }

}
