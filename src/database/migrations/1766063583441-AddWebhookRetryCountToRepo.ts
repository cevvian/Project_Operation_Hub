import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebhookRetryCountToRepo1766063583441 implements MigrationInterface {
    name = 'AddWebhookRetryCountToRepo1766063583441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" ADD "webhookRetryCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "webhookRetryCount"`);
    }

}
