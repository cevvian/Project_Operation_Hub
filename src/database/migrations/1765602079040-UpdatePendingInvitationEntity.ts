import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePendingInvitationEntity1765602079040 implements MigrationInterface {
    name = 'UpdatePendingInvitationEntity1765602079040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ADD "status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" DROP CONSTRAINT "FK_79c9ae6887c401e0314f1642306"`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ADD CONSTRAINT "FK_79c9ae6887c401e0314f1642306" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" DROP CONSTRAINT "FK_79c9ae6887c401e0314f1642306"`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" ADD CONSTRAINT "FK_79c9ae6887c401e0314f1642306" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "pending_project_invitations" DROP COLUMN "email"`);
    }

}
