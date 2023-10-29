// UserComplaint Migration
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class Usercomplain1698579653400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user-complaint',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'reported_user_id',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user-complaint',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'user-complaint',
      new TableIndex({ name: 'IDX_USER_COMPLAINT', columnNames: ['user_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('user-complaint', 'IDX_USER_COMPLAINT');
    await queryRunner.dropTable('user-complaint');
  }
}
