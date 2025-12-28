import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsoleOutputToBuild1703800000000 implements MigrationInterface {
    name = 'AddConsoleOutputToBuild1703800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "builds" ADD "consoleOutput" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "builds" DROP COLUMN "consoleOutput"`);
    }
}
