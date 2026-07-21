import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCurrencies002 implements MigrationInterface {
  name = 'SeedCurrencies002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO currencies (code, name, name_ar, symbol, exchange_rate, is_default, is_active, decimal_places)
      VALUES 
        -- Omani Rial (default currency)
        ('OMR', 'Omani Rial', 'ريال عماني', 'ر.ع.', 1.000000, true, true, 3),
        
        -- UAE Dirham
        ('AED', 'UAE Dirham', 'درهم إماراتي', 'د.إ', 9.540000, false, true, 2),
        
        -- Saudi Riyal
        ('SAR', 'Saudi Riyal', 'ريال سعودي', 'ر.س', 9.750000, false, true, 2),
        
        -- Qatari Riyal
        ('QAR', 'Qatari Riyal', 'ريال قطري', 'ر.ق', 9.460000, false, true, 2),
        
        -- Kuwaiti Dinar
        ('KWD', 'Kuwaiti Dinar', 'دينار كويتي', 'د.ك', 0.795000, false, true, 3),
        
        -- Bahraini Dinar
        ('BHD', 'Bahraini Dinar', 'دينار بحريني', 'د.ب', 0.980000, false, true, 3),
        
        -- US Dollar
        ('USD', 'US Dollar', 'دولار أمريكي', '$', 2.598000, false, true, 2),
        
        -- Euro
        ('EUR', 'Euro', 'يورو', '€', 2.380000, false, true, 2),
        
        -- British Pound
        ('GBP', 'British Pound', 'جنيه إسترليني', '£', 2.050000, false, true, 2)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Verify seed
    const count = await queryRunner.query(`SELECT COUNT(*) FROM currencies`);
    console.log(`Seeded ${count[0].count} currencies`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all seeded currencies
    await queryRunner.query(`
      DELETE FROM currencies 
      WHERE code IN ('OMR', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'USD', 'EUR', 'GBP')
    `);
  }
}
