// UserBan modification
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserBan1698579653401 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "ban_timestamp" bigint DEFAULT null
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "ban_reason" text DEFAULT null
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "ban_timestamp"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "ban_reason"`);
  }
}
