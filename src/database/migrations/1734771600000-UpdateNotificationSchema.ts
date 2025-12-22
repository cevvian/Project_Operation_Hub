import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNotificationSchema1734771600000 implements MigrationInterface {
    name = 'UpdateNotificationSchema1734771600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop old foreign key constraint
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_f6ee9774c0683c28751f59d9fd6"`);

        // Rename column uploadedById to senderId
        await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN "uploadedById" TO "senderId"`);

        // Rename column content to message
        await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN "content" TO "message"`);

        // Add new columns
        await queryRunner.query(`ALTER TABLE "notifications" ADD "title" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "metadata" json`);

        // Change type column to enum
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'WARNING', 'CRITICAL')`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'INFO'`);

        // Re-add foreign key with new column name
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Create user_notifications table
        await queryRunner.query(`CREATE TABLE "user_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, "receivedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "notificationId" uuid, CONSTRAINT "PK_user_notifications" PRIMARY KEY ("id"))`);

        // Add foreign keys for user_notifications
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_user_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_notifications" ADD CONSTRAINT "FK_user_notifications_notification" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Create index for performance
        await queryRunner.query(`CREATE INDEX "IDX_user_notifications_user_isRead" ON "user_notifications" ("userId", "isRead")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX "public"."IDX_user_notifications_user_isRead"`);

        // Drop user_notifications table and constraints
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_user_notifications_notification"`);
        await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_user_notifications_user"`);
        await queryRunner.query(`DROP TABLE "user_notifications"`);

        // Revert notifications table changes
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_sender"`);

        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "type" character varying NOT NULL`);

        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "title"`);

        await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN "message" TO "content"`);
        await queryRunner.query(`ALTER TABLE "notifications" RENAME COLUMN "senderId" TO "uploadedById"`);

        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_f6ee9774c0683c28751f59d9fd6" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
