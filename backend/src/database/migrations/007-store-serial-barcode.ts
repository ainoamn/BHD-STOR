import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Store identity for physical stickers:
 * - store_serial: human-readable (BHD26-XXXXXX)
 * - store_code: compact barcode payload (BHD26XXXXXX)
 * Scan URL /s/{serial|code} opens that store only — not the marketplace home.
 */
export class StoreSerialBarcode007 implements MigrationInterface {
  name = 'StoreSerialBarcode007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stores');
    if (!table) return;

    if (!table.findColumnByName('store_serial')) {
      await queryRunner.addColumn(
        'stores',
        new TableColumn({
          name: 'store_serial',
          type: 'varchar',
          length: '32',
          isNullable: true,
          isUnique: true,
        }),
      );
    }

    if (!table.findColumnByName('store_code')) {
      await queryRunner.addColumn(
        'stores',
        new TableColumn({
          name: 'store_code',
          type: 'varchar',
          length: '32',
          isNullable: true,
          isUnique: true,
        }),
      );
    }

    const indexes = table.indices.map((i) => i.name);
    if (!indexes.includes('IDX_stores_store_serial')) {
      await queryRunner.createIndex(
        'stores',
        new TableIndex({
          name: 'IDX_stores_store_serial',
          columnNames: ['store_serial'],
          isUnique: true,
        }),
      );
    }
    if (!indexes.includes('IDX_stores_store_code')) {
      await queryRunner.createIndex(
        'stores',
        new TableIndex({
          name: 'IDX_stores_store_code',
          columnNames: ['store_code'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stores');
    if (!table) return;

    const serialIdx = table.indices.find((i) => i.name === 'IDX_stores_store_serial');
    if (serialIdx) await queryRunner.dropIndex('stores', serialIdx);

    const codeIdx = table.indices.find((i) => i.name === 'IDX_stores_store_code');
    if (codeIdx) await queryRunner.dropIndex('stores', codeIdx);

    if (table.findColumnByName('store_serial')) {
      await queryRunner.dropColumn('stores', 'store_serial');
    }
    if (table.findColumnByName('store_code')) {
      await queryRunner.dropColumn('stores', 'store_code');
    }
  }
}
