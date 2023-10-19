import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class Connections1697721465860 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем таблицу Connection
    await queryRunner.createTable(
      new Table({
        name: 'connection',
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
          },
          {
            name: 'connectId',
            type: 'text',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'connectedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Создаем внешний ключ для user_id
    await queryRunner.createForeignKey(
      'connection',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    // Создаем индекс для обратной связи
    await queryRunner.createIndex(
      'connection',
      new TableIndex({ name: 'IDX_USER_CONNECTION', columnNames: ['user_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('connection', 'IDX_USER_CONNECTION');
    await queryRunner.dropTable('connection');
  }
}
