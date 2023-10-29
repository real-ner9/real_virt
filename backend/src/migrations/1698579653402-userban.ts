// UserBan modification
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserBan1698579653402 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "blockedUntil" timestamp DEFAULT null
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "blockReason" text DEFAULT null
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "blockedUntil"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "blockReason"`);
  }
}
