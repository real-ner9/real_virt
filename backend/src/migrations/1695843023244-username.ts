import { MigrationInterface, QueryRunner } from 'typeorm';

export class Username1695843023244 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "username" text NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "showUsername" boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "showUsername"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`);
  }
}
