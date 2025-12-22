import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedByToRepo1734527000000 implements MigrationInterface {
    name = 'AddCreatedByToRepo1734527000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" ADD "createdById" uuid`);
        await queryRunner.query(`ALTER TABLE "repos" ADD CONSTRAINT "FK_a34ba0902011c7f4a21e6c6d7e9" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP CONSTRAINT "FK_a34ba0902011c7f4a21e6c6d7e9"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "createdById"`);
    }

}
