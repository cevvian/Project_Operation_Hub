import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditLogTable1767429564003 implements MigrationInterface {
    name = 'AddAuditLogTable1767429564003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "actionDetail" text`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "userEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "severity" character varying(20) NOT NULL DEFAULT 'INFO'`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "ipAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "logType" character varying(20) NOT NULL DEFAULT 'automatic'`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "action" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "targetType" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "targetId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "targetId" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_3197969cb5ed9b2a00252a3c9e" ON "audit_logs" ("severity") `);
        await queryRunner.query(`CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3197969cb5ed9b2a00252a3c9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "targetId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "targetId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "targetType" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "action" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "logType"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "ipAddress"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "severity"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userEmail"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "actionDetail"`);
    }

}
