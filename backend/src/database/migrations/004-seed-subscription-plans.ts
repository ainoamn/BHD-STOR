import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSubscriptionPlans004 implements MigrationInterface {
  name = 'SeedSubscriptionPlans004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO subscription_plans 
        (name, name_ar, tier, description, description_ar, price_monthly, price_yearly, currency_code, product_limit, storage_limit_mb, transaction_fee_percent, features, is_active, sort_order)
      VALUES 
        (
          'Free',
          'مجاني',
          'free',
          'Perfect for getting started. List up to 10 products with no monthly fee.',
          'مثالي للبدء. أضف حتى 10 منتجات بدون رسوم شهرية.',
          0.000,
          0.000,
          'OMR',
          10,
          100,
          5.00,
          '[
            {"feature": "up_to_10_products", "label": "Up to 10 products", "label_ar": "حتى 10 منتجات", "included": true},
            {"feature": "basic_analytics", "label": "Basic analytics", "label_ar": "تحليلات أساسية", "included": true},
            {"feature": "standard_support", "label": "Email support", "label_ar": "دعم عبر البريد الإلكتروني", "included": true},
            {"feature": "100mb_storage", "label": "100 MB storage", "label_ar": "100 ميجابايت تخزين", "included": true},
            {"feature": "5_percent_fee", "label": "5% transaction fee", "label_ar": "5% رسوم المعاملات", "included": true},
            {"feature": "custom_domain", "label": "Custom domain", "label_ar": "نطاق مخصص", "included": false},
            {"feature": "advanced_analytics", "label": "Advanced analytics", "label_ar": "تحليلات متقدمة", "included": false},
            {"feature": "priority_support", "label": "Priority support", "label_ar": "دعم ذو أولوية", "included": false},
            {"feature": "bulk_import", "label": "Bulk product import", "label_ar": "استيراد المنتجات بالجملة", "included": false},
            {"feature": "api_access", "label": "API access", "label_ar": "وصول API", "included": false}
          ]'::jsonb,
          true,
          1
        ),
        (
          'Basic',
          'أساسي',
          'basic',
          'Great for small businesses. List up to 100 products with reduced transaction fees.',
          'ممتاز للشركات الصغيرة. أضف حتى 100 منتج برسوم معاملات مخفضة.',
          9.900,
          99.000,
          'OMR',
          100,
          1024,
          3.50,
          '[
            {"feature": "up_to_100_products", "label": "Up to 100 products", "label_ar": "حتى 100 منتج", "included": true},
            {"feature": "basic_analytics", "label": "Basic analytics", "label_ar": "تحليلات أساسية", "included": true},
            {"feature": "standard_support", "label": "Email support", "label_ar": "دعم عبر البريد الإلكتروني", "included": true},
            {"feature": "1gb_storage", "label": "1 GB storage", "label_ar": "1 جيجابايت تخزين", "included": true},
            {"feature": "3.5_percent_fee", "label": "3.5% transaction fee", "label_ar": "3.5% رسوم المعاملات", "included": true},
            {"feature": "custom_domain", "label": "Custom domain", "label_ar": "نطاق مخصص", "included": true},
            {"feature": "advanced_analytics", "label": "Advanced analytics", "label_ar": "تحليلات متقدمة", "included": false},
            {"feature": "priority_support", "label": "Priority support", "label_ar": "دعم ذو أولوية", "included": false},
            {"feature": "bulk_import", "label": "Bulk product import", "label_ar": "استيراد المنتجات بالجملة", "included": false},
            {"feature": "api_access", "label": "API access", "label_ar": "وصول API", "included": false}
          ]'::jsonb,
          true,
          2
        ),
        (
          'Premium',
          'مميز',
          'premium',
          'For growing businesses. Unlimited products, advanced analytics, and priority support.',
          'للشركات النامية. منتجات غير محدودة وتحليلات متقدمة ودعم ذو أولوية.',
          29.900,
          299.000,
          'OMR',
          1000,
          10240,
          2.00,
          '[
            {"feature": "up_to_1000_products", "label": "Up to 1,000 products", "label_ar": "حتى 1000 منتج", "included": true},
            {"feature": "basic_analytics", "label": "Basic analytics", "label_ar": "تحليلات أساسية", "included": true},
            {"feature": "priority_support", "label": "Priority support", "label_ar": "دعم ذو أولوية", "included": true},
            {"feature": "10gb_storage", "label": "10 GB storage", "label_ar": "10 جيجابايت تخزين", "included": true},
            {"feature": "2_percent_fee", "label": "2% transaction fee", "label_ar": "2% رسوم المعاملات", "included": true},
            {"feature": "custom_domain", "label": "Custom domain", "label_ar": "نطاق مخصص", "included": true},
            {"feature": "advanced_analytics", "label": "Advanced analytics", "label_ar": "تحليلات متقدمة", "included": true},
            {"feature": "multi_language", "label": "Multi-language store", "label_ar": "متجر متعدد اللغات", "included": true},
            {"feature": "bulk_import", "label": "Bulk product import", "label_ar": "استيراد المنتجات بالجملة", "included": true},
            {"feature": "api_access", "label": "API access", "label_ar": "وصول API", "included": false}
          ]'::jsonb,
          true,
          3
        ),
        (
          'Enterprise',
          'مؤسسي',
          'enterprise',
          'Full-featured solution for large enterprises with dedicated support and custom integrations.',
          'حل متكامل للمؤسسات الكبيرة مع دعم مخصص وتكاملات مخصصة.',
          99.900,
          999.000,
          'OMR',
          0,
          102400,
          0.00,
          '[
            {"feature": "unlimited_products", "label": "Unlimited products", "label_ar": "منتجات غير محدودة", "included": true},
            {"feature": "basic_analytics", "label": "Basic analytics", "label_ar": "تحليلات أساسية", "included": true},
            {"feature": "dedicated_support", "label": "Dedicated account manager", "label_ar": "مدير حساب مخصص", "included": true},
            {"feature": "100gb_storage", "label": "100 GB storage", "label_ar": "100 جيجابايت تخزين", "included": true},
            {"feature": "no_fee", "label": "0% transaction fee", "label_ar": "0% رسوم المعاملات", "included": true},
            {"feature": "custom_domain", "label": "Custom domain", "label_ar": "نطاق مخصص", "included": true},
            {"feature": "advanced_analytics", "label": "Advanced analytics + AI insights", "label_ar": "تحليلات متقدمة + رؤى الذكاء الاصطناعي", "included": true},
            {"feature": "multi_language", "label": "Multi-language store", "label_ar": "متجر متعدد اللغات", "included": true},
            {"feature": "bulk_import", "label": "Bulk product import/export", "label_ar": "استيراد/تصدير المنتجات بالجملة", "included": true},
            {"feature": "api_access", "label": "Full API access + webhooks", "label_ar": "وصول كامل لـ API + webhooks", "included": true},
            {"feature": "custom_integrations", "label": "Custom integrations", "label_ar": "تكاملات مخصصة", "included": true},
            {"feature": "white_label", "label": "White-label option", "label_ar": "خيار العلامة البيضاء", "included": true},
            {"feature": "sub_accounts", "label": "Unlimited sub-accounts", "label_ar": "حسابات فرعية غير محدودة", "included": true}
          ]'::jsonb,
          true,
          4
        )
      ON CONFLICT DO NOTHING;
    `);

    // Verify seed
    const count = await queryRunner.query(`SELECT COUNT(*) FROM subscription_plans`);
    console.log(`Seeded ${count[0].count} subscription plans`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM subscription_plans 
      WHERE tier IN ('free', 'basic', 'premium', 'enterprise')
    `);
  }
}
