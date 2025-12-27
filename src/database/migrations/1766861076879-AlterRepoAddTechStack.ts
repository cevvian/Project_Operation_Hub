import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterRepoAddTechStack1766861076879 implements MigrationInterface {
    name = 'AlterRepoAddTechStack1766861076879'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" ADD "techStack" character varying(50) NOT NULL DEFAULT 'nodejs'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "techStack"`);
    }

}
