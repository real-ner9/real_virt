import { MigrationInterface, QueryRunner } from 'typeorm';

export class LastLoginTimestamp1698323465447 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "lastLoginTimestamp" bigint DEFAULT null
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "lastLoginTimestamp"`,
    );
  }
}
