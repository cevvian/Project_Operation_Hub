import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUniqueConstraintFromUserName1765390017014 implements MigrationInterface {
    name = 'RemoveUniqueConstraintFromUserName1765390017014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "priority" character varying NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."tasks_status_enum" RENAME TO "tasks_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'QA', 'BUG', 'DONE', 'BLOCKED')`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "public"."tasks_status_enum" USING "status"::"text"::"public"."tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_51b8b26ac168fbe7d6f5653e6cf"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_51b8b26ac168fbe7d6f5653e6cf" UNIQUE ("name")`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum_old" AS ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'QA', 'DONE', 'BLOCKED')`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "public"."tasks_status_enum_old" USING "status"::"text"::"public"."tasks_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tasks_status_enum_old" RENAME TO "tasks_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "priority"`);
    }

}
