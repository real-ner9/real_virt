import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class Blocks1698579653399 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_block',
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
            name: 'blockedUserId',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'blockedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user_block',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_block');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    await queryRunner.dropForeignKey('user_block', foreignKey);
    await queryRunner.dropTable('user_block');
  }
}
