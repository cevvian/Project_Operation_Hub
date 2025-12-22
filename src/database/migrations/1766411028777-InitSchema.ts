import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1766411028777 implements MigrationInterface {
    name = 'InitSchema1766411028777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP CONSTRAINT "FK_b3fb22dd52ef1524e2dcb7ccd33"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP CONSTRAINT "FK_a34ba0902011c7f4a21e6c6d7e9"`);
        await queryRunner.query(`ALTER TABLE "builds" DROP CONSTRAINT "FK_3b3fa0995bf8a730265411ca6ca"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_sender"`);
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_user_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_user_notifications_notification"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_notifications_user_isRead"`);
        await queryRunner.query(`ALTER TABLE "builds" DROP COLUMN "projectId"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "githubId" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD CONSTRAINT "UQ_c3cf03f01a3e60feb84b0be5747" UNIQUE ("githubId")`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "number" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "url" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "isPrivate" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "builds" ADD "commitHash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "builds" ADD "jenkinsJobName" character varying`);
        await queryRunner.query(`ALTER TABLE "builds" ADD "jenkinsBuildNumber" integer`);
        await queryRunner.query(`ALTER TABLE "builds" ADD "repoId" uuid`);
        await queryRunner.query(`ALTER TABLE "deployments" ADD "buildId" uuid`);
        await queryRunner.query(`ALTER TABLE "deployments" ADD CONSTRAINT "UQ_1c638197d3d83a6edcf8bbcef78" UNIQUE ("buildId")`);
        await queryRunner.query(`ALTER TABLE "repos" ALTER COLUMN "createdById" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."builds_status_enum" RENAME TO "builds_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."builds_status_enum" AS ENUM('pending', 'success', 'failed', 'running')`);
        await queryRunner.query(`ALTER TABLE "builds" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "builds" ALTER COLUMN "status" TYPE "public"."builds_status_enum" USING "status"::"text"::"public"."builds_status_enum"`);
        await queryRunner.query(`ALTER TABLE "builds" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."builds_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "title" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD CONSTRAINT "FK_b3fb22dd52ef1524e2dcb7ccd33" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repos" ADD CONSTRAINT "FK_084c2ac9afddbf8fcb6dd932db1" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "builds" ADD CONSTRAINT "FK_f9430bb22fbd02114ee70ba96fa" FOREIGN KEY ("repoId") REFERENCES "repos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deployments" ADD CONSTRAINT "FK_1c638197d3d83a6edcf8bbcef78" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_ddb7981cf939fe620179bfea33a" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_cb22b968fe41a9f8b219327fde8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_01a2c65f414d36cfe6f5d950fb2" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_01a2c65f414d36cfe6f5d950fb2"`);
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_cb22b968fe41a9f8b219327fde8"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_ddb7981cf939fe620179bfea33a"`);
        await queryRunner.query(`ALTER TABLE "deployments" DROP CONSTRAINT "FK_1c638197d3d83a6edcf8bbcef78"`);
        await queryRunner.query(`ALTER TABLE "builds" DROP CONSTRAINT "FK_f9430bb22fbd02114ee70ba96fa"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP CONSTRAINT "FK_084c2ac9afddbf8fcb6dd932db1"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP CONSTRAINT "FK_b3fb22dd52ef1524e2dcb7ccd33"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "title" SET DEFAULT ''`);
        await queryRunner.query(`CREATE TYPE "public"."builds_status_enum_old" AS ENUM('success', 'failed', 'running')`);
        await queryRunner.query(`ALTER TABLE "builds" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "builds" ALTER COLUMN "status" TYPE "public"."builds_status_enum_old" USING "status"::"text"::"public"."builds_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "builds" ALTER COLUMN "status" SET DEFAULT 'running'`);
        await queryRunner.query(`DROP TYPE "public"."builds_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."builds_status_enum_old" RENAME TO "builds_status_enum"`);
        await queryRunner.query(`ALTER TABLE "repos" ALTER COLUMN "createdById" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deployments" DROP CONSTRAINT "UQ_1c638197d3d83a6edcf8bbcef78"`);
        await queryRunner.query(`ALTER TABLE "deployments" DROP COLUMN "buildId"`);
        await queryRunner.query(`ALTER TABLE "builds" DROP COLUMN "repoId"`);
        await queryRunner.query(`ALTER TABLE "builds" DROP COLUMN "jenkinsBuildNumber"`);
        await queryRunner.query(`ALTER TABLE "builds" DROP COLUMN "jenkinsJobName"`);
        await queryRunner.query(`ALTER TABLE "builds" DROP COLUMN "commitHash"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "url"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "number"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP CONSTRAINT "UQ_c3cf03f01a3e60feb84b0be5747"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "githubId"`);
        await queryRunner.query(`ALTER TABLE "builds" ADD "projectId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_user_notifications_user_isRead" ON "user_notifications" ("isRead", "userId") `);
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_user_notifications_notification" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_user_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "builds" ADD CONSTRAINT "FK_3b3fa0995bf8a730265411ca6ca" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repos" ADD CONSTRAINT "FK_a34ba0902011c7f4a21e6c6d7e9" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD CONSTRAINT "FK_b3fb22dd52ef1524e2dcb7ccd33" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
