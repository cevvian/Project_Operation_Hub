import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUserStatusEnum1767107312336 implements MigrationInterface {
    name = 'AlterUserStatusEnum1767107312336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "is_verified" TO "status"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('UNVERIFIED', 'ACTIVE', 'LOCKED')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'UNVERIFIED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "status" TO "is_verified"`);
    }

}
