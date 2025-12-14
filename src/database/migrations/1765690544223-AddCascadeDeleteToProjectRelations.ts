import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToProjectRelations1765690544223 implements MigrationInterface {
    name = 'AddCascadeDeleteToProjectRelations1765690544223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" DROP CONSTRAINT "FK_83bc3f92b506f2679193e7c7d4c"`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ADD CONSTRAINT "FK_83bc3f92b506f2679193e7c7d4c" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" DROP CONSTRAINT "FK_83bc3f92b506f2679193e7c7d4c"`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ADD CONSTRAINT "FK_83bc3f92b506f2679193e7c7d4c" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
