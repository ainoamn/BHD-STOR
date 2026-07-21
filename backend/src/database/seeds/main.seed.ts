import { DataSource } from 'typeorm';
import { hashSync } from 'bcrypt';

/**
 * ============================================================================
 * BHD Oman Marketplace - Main Database Seed
 * Seeds: admin user, sample stores, products, payment gateways, shipping carriers
 * ============================================================================
 */

const SALT_ROUNDS = 12;

export async function runSeed(dataSource: DataSource): Promise<void> {
  console.log('Starting database seed...');

  await seedAdminUser(dataSource);
  await seedSampleStores(dataSource);
  await seedSampleProducts(dataSource);
  await seedPaymentGateways(dataSource);
  await seedShippingCarriers(dataSource);

  console.log('Database seed completed successfully!');
}

/**
 * Seed admin user (super_admin)
 */
async function seedAdminUser(dataSource: DataSource): Promise<void> {
  console.log('Seeding admin user...');

  const existingAdmin = await dataSource.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['admin@bhdoman.com']
  );

  if (existingAdmin.length > 0) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  const hashedPassword = hashSync('Bhd@dmin2024!', SALT_ROUNDS);

  await dataSource.query(`
    INSERT INTO users 
      (email, password, first_name, last_name, first_name_ar, last_name_ar, phone, role, status, email_verified, phone_verified, metadata)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `, [
    'admin@bhdoman.com',
    hashedPassword,
    'System',
    'Administrator',
    'مدير',
    'النظام',
    '+96891234567',
    'super_admin',
    'active',
    true,
    true,
    JSON.stringify({ seeded: true, source: 'main.seed.ts' }),
  ]);

  console.log('Admin user seeded successfully');
}

/**
 * Seed sample stores
 */
async function seedSampleStores(dataSource: DataSource): Promise<void> {
  console.log('Seeding sample stores...');

  const adminUser = await dataSource.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['admin@bhdoman.com']
  );

  if (adminUser.length === 0) {
    console.warn('Admin user not found, skipping store seed');
    return;
  }

  const ownerId = adminUser[0].id;

  const stores = [
    {
      name: 'Al-Rashid Electronics',
      name_ar: 'الرشيد للإلكترونيات',
      slug: 'al-rashid-electronics',
      description: 'Your trusted source for the latest electronics and gadgets in Oman. We offer smartphones, laptops, TVs, and home appliances at competitive prices.',
      description_ar: 'مصدرك الموثوق للإلكترونيات والأدوات الحديثة في عمان. نقدم الهواتف الذكية وأجهزة الكمبيوتر المحمولة وأجهزة التلفاز والأجهزة المنزلية بأسعار تنافسية.',
      email: 'info@alrashid-electronics.om',
      phone: '+96824567890',
      cr_number: 'CR-123456',
      vat_number: 'VAT-789012',
      address: 'Way No. 1234, Building 56, Al Khuwair',
      address_ar: 'طريق رقم 1234، مبنى 56، الخوير',
      city: 'Muscat',
      region: 'Muscat Governorate',
      latitude: 23.5880,
      longitude: 58.3829,
    },
    {
      name: 'Omani Heritage Handicrafts',
      name_ar: 'تراث عمان للحرف اليدوية',
      slug: 'omani-heritage-handicrafts',
      description: 'Authentic Omani handicrafts, traditional silver jewelry, hand-woven textiles, and pottery. Preserving the rich cultural heritage of Oman.',
      description_ar: 'الحرف العمانية الأصيلة والمجوهرات الفضية التقليدية والمنسوجات اليدوية والفخار. الحفاظ على التراث الثقافي الغني لعمان.',
      email: 'info@omaniheritage.om',
      phone: '+96824567891',
      cr_number: 'CR-234567',
      vat_number: 'VAT-890123',
      address: 'Nizwa Souq, Old Town',
      address_ar: 'سوق نزوى، المدينة القديمة',
      city: 'Nizwa',
      region: 'Ad Dakhiliyah',
      latitude: 22.9333,
      longitude: 57.5333,
    },
    {
      name: 'Modern Home Oman',
      name_ar: 'المنزل العصري عمان',
      slug: 'modern-home-oman',
      description: 'Contemporary furniture, home decor, kitchen appliances, and interior design solutions for modern Omani homes.',
      description_ar: 'أثاث عصري وديكور منزل وأجهزة مطبخ وحلول تصميم داخلي للمنازل العمانية الحديثة.',
      email: 'info@modernhome.om',
      phone: '+96824567892',
      cr_number: 'CR-345678',
      vat_number: 'VAT-901234',
      address: 'Sultan Qaboos Street, Azaiba',
      address_ar: 'شارع السلطان قابوس، العذيبة',
      city: 'Muscat',
      region: 'Muscat Governorate',
      latitude: 23.6139,
      longitude: 58.5423,
    },
    {
      name: 'Fresh Market Oman',
      name_ar: 'سوق الطازج عمان',
      slug: 'fresh-market-oman',
      description: 'Fresh fruits, vegetables, organic produce, and Omani specialties delivered to your doorstep. Supporting local farmers.',
      description_ar: 'فواكه طازجة وخضروات ومنتجات عضوية ومنتجات عمانية متخصصة تصل إلى باب منزلك. دعم المزارعين المحليين.',
      email: 'info@freshmarket.om',
      phone: '+96824567893',
      cr_number: 'CR-456789',
      vat_number: 'VAT-012345',
      address: 'Al Seeb Beach Road',
      address_ar: 'طريق شاطئ السيب',
      city: 'Seeb',
      region: 'Muscat Governorate',
      latitude: 23.6800,
      longitude: 58.1800,
    },
  ];

  for (const store of stores) {
    const existing = await dataSource.query(
      `SELECT id FROM stores WHERE slug = $1 LIMIT 1`,
      [store.slug]
    );

    if (existing.length === 0) {
      await dataSource.query(`
        INSERT INTO stores 
          (owner_id, name, name_ar, slug, description, description_ar, email, phone, cr_number, vat_number, 
           address, address_ar, city, region, country, latitude, longitude, status, metadata)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        ownerId, store.name, store.name_ar, store.slug, store.description, store.description_ar,
        store.email, store.phone, store.cr_number, store.vat_number,
        store.address, store.address_ar, store.city, store.region, 'OM',
        store.latitude, store.longitude, 'active',
        JSON.stringify({ seeded: true, source: 'main.seed.ts' }),
      ]);
      console.log(`  Store created: ${store.name}`);
    } else {
      console.log(`  Store exists: ${store.name}`);
    }
  }

  console.log('Sample stores seeded successfully');
}

/**
 * Seed sample products
 */
async function seedSampleProducts(dataSource: DataSource): Promise<void> {
  console.log('Seeding sample products...');

  const stores = await dataSource.query(`SELECT id, slug FROM stores LIMIT 4`);
  if (stores.length === 0) {
    console.warn('No stores found, skipping product seed');
    return;
  }

  const categories = await dataSource.query(`SELECT id, slug FROM categories WHERE slug IN ('mobile-phones', 'mens-clothing', 'furniture', 'fresh-produce')`);
  
  const products = [
    {
      store_slug: 'al-rashid-electronics',
      category_slug: 'mobile-phones',
      name: 'iPhone 15 Pro Max 256GB',
      name_ar: 'آيفون 15 برو ماكس 256 جيجابايت',
      slug: 'iphone-15-pro-max-256gb',
      description: 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system. 256GB storage capacity.',
      description_ar: 'أحدث آيفون مع شريحة A17 Pro، تصميم التيتانيوم، ونظام كاميرا متقدم. سعة تخزين 256 جيجابايت.',
      sku: 'APL-IP15PM-256',
      price: 499.000,
      compare_at_price: 525.000,
      quantity: 25,
      weight: 0.221,
      images: JSON.stringify([
        { url: '/uploads/products/iphone-15-pro-max-1.jpg', alt: 'iPhone 15 Pro Max Front' },
        { url: '/uploads/products/iphone-15-pro-max-2.jpg', alt: 'iPhone 15 Pro Max Back' },
      ]),
      attributes: JSON.stringify({
        color: 'Natural Titanium',
        storage: '256GB',
        display: '6.7" Super Retina XDR',
        processor: 'A17 Pro',
      }),
      is_featured: true,
    },
    {
      store_slug: 'al-rashid-electronics',
      category_slug: 'mobile-phones',
      name: 'Samsung Galaxy S24 Ultra 512GB',
      name_ar: 'سامسونج جالاكسي S24 الترا 512 جيجابايت',
      slug: 'samsung-galaxy-s24-ultra-512gb',
      description: 'Samsung flagship with AI features, S Pen, 200MP camera, and 512GB storage.',
      description_ar: 'العلامة الرئيسية لسامسونج مع ميزات الذكاء الاصطناعي، قلم S، كاميرا 200 ميجابكسل، وسعة تخزين 512 جيجابايت.',
      sku: 'SAM-S24U-512',
      price: 459.000,
      compare_at_price: 490.000,
      quantity: 18,
      weight: 0.233,
      images: JSON.stringify([
        { url: '/uploads/products/galaxy-s24-ultra-1.jpg', alt: 'Galaxy S24 Ultra Front' },
      ]),
      attributes: JSON.stringify({
        color: 'Titanium Gray',
        storage: '512GB',
        display: '6.8" QHD+ AMOLED',
        processor: 'Snapdragon 8 Gen 3',
      }),
      is_featured: true,
    },
    {
      store_slug: 'omani-heritage-handicrafts',
      category_slug: 'mens-clothing',
      name: 'Handcrafted Omani Dagger (Khanjar)',
      name_ar: 'خنجر عماني مصنوع يدوياً',
      slug: 'handcrafted-omani-khanjar',
      description: 'Authentic Omani Khanjar crafted by master artisans. Features silver filigree work and traditional design.',
      description_ar: 'خنجر عماني أصيل صنعه حرفيون بارعون. يتميز بتصميم فضي متقن وتصميم تقليدي.',
      sku: 'OMN-KHAN-001',
      price: 85.000,
      compare_at_price: null,
      quantity: 8,
      weight: 1.500,
      images: JSON.stringify([
        { url: '/uploads/products/khanjar-1.jpg', alt: 'Omani Khanjar' },
      ]),
      attributes: JSON.stringify({
        material: 'Silver & Wood',
        length: '30cm',
        origin: 'Nizwa, Oman',
        handmade: true,
      }),
      is_featured: true,
    },
    {
      store_slug: 'modern-home-oman',
      category_slug: 'furniture',
      name: 'Modern Omani Majlis Sofa Set',
      name_ar: 'طقم جلسة عمانية عصرية',
      slug: 'modern-omani-majlis-sofa-set',
      description: 'Elegant majlis sofa set combining traditional Omani design with modern comfort. Includes 5 pieces.',
      description_ar: 'طقم جلسة أنيق يجمع بين التصميم العماني التقليدي والراحة العصرية. يتضمن 5 قطع.',
      sku: 'FUR-MAJ-005',
      price: 350.000,
      compare_at_price: 420.000,
      quantity: 5,
      weight: 85.000,
      images: JSON.stringify([
        { url: '/uploads/products/majlis-set-1.jpg', alt: 'Omani Majlis Sofa Set' },
      ]),
      attributes: JSON.stringify({
        pieces: 5,
        material: 'Premium Fabric & Wood',
        color: 'Beige & Gold',
        dimensions: '300x250cm',
      }),
      is_featured: true,
    },
    {
      store_slug: 'fresh-market-oman',
      category_slug: 'fresh-produce',
      name: 'Premium Omani Dates (1kg)',
      name_ar: 'تمور عمانية فاخرة (1 كجم)',
      slug: 'premium-omani-dates-1kg',
      description: 'Hand-picked premium Khalas dates from the interior region of Oman. Sweet, soft, and nutritious.',
      description_ar: 'تمور خلاص فاخرة منتقاة يدوياً من المنطقة الداخلية في عمان. حلوة وناعمة ومغذية.',
      sku: 'FOD-DAT-001',
      price: 3.500,
      compare_at_price: 4.000,
      quantity: 100,
      weight: 1.000,
      images: JSON.stringify([
        { url: '/uploads/products/omani-dates-1.jpg', alt: 'Premium Omani Dates' },
      ]),
      attributes: JSON.stringify({
        variety: 'Khalas',
        origin: 'Al Dakhiliyah',
        organic: true,
        grade: 'Premium',
      }),
      is_featured: true,
    },
    {
      store_slug: 'fresh-market-oman',
      category_slug: 'fresh-produce',
      name: 'Fresh Omani Honey (500g)',
      name_ar: 'عسل عماني طازج (500 جرام)',
      slug: 'fresh-omani-honey-500g',
      description: 'Pure, raw honey sourced from Omani beekeepers in the Al Jabal Al Akhdar region. Unprocessed and natural.',
      description_ar: 'عسل نقي وخام من مربي النحل العمانيين في منطقة الجبل الأخضر. غير معالج وطبيعي.',
      sku: 'FOD-HON-001',
      price: 12.000,
      compare_at_price: null,
      quantity: 50,
      weight: 0.500,
      images: JSON.stringify([
        { url: '/uploads/products/omani-honey-1.jpg', alt: 'Fresh Omani Honey' },
      ]),
      attributes: JSON.stringify({
        origin: 'Al Jabal Al Akhdar',
        type: 'Sidr Honey',
        organic: true,
        net_weight: '500g',
      }),
      is_featured: false,
    },
  ];

  for (const product of products) {
    const existing = await dataSource.query(
      `SELECT id FROM products WHERE slug = $1 LIMIT 1`,
      [product.slug]
    );

    if (existing.length > 0) {
      console.log(`  Product exists: ${product.name}`);
      continue;
    }

    const store = stores.find(s => s.slug === product.store_slug);
    if (!store) {
      console.warn(`  Store not found: ${product.store_slug}`);
      continue;
    }

    const category = categories.find(c => c.slug === product.category_slug);
    const categoryId = category ? category.id : null;

    await dataSource.query(`
      INSERT INTO products 
        (store_id, category_id, name, name_ar, slug, description, description_ar, sku, price, compare_at_price, 
         currency_code, quantity, weight, status, is_featured, images, attributes, metadata)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      store.id, categoryId, product.name, product.name_ar, product.slug,
      product.description, product.description_ar, product.sku,
      product.price, product.compare_at_price, 'OMR', product.quantity,
      product.weight, 'active', product.is_featured,
      product.images, product.attributes,
      JSON.stringify({ seeded: true, source: 'main.seed.ts' }),
    ]);

    console.log(`  Product created: ${product.name}`);
  }

  console.log('Sample products seeded successfully');
}

/**
 * Seed payment gateways configuration
 * Placeholder values must be replaced with actual credentials before activating in production
 */
async function seedPaymentGateways(dataSource: DataSource): Promise<void> {
  console.log('Seeding payment gateways...');

  const gateways = [
    {
      name: 'OmanNet',
      code: 'omannet',
      api_endpoint: 'https://api.omannet.com/v1',
      sandbox_mode: true,
      is_active: false,
      supported_methods: JSON.stringify(['credit_card', 'debit_card']),
      config: JSON.stringify({
        merchant_id: process.env.OMANNET_MERCHANT_ID || 'REPLACE_WITH_MERCHANT_ID',
        api_version: 'v1',
        supported_currencies: ['OMR', 'USD'],
        webhook_url: '/webhooks/omannet',
      }),
    },
    {
      name: 'Thawani',
      code: 'thawani',
      api_endpoint: 'https://uatcheckout.thawani.om',
      sandbox_mode: true,
      is_active: false,
      supported_methods: JSON.stringify(['credit_card', 'debit_card', 'apple_pay']),
      config: JSON.stringify({
        publishable_key: process.env.THAWANI_PUBLISHABLE_KEY || 'REPLACE_WITH_PUBLISHABLE_KEY',
        secret_key: process.env.THAWANI_SECRET_KEY || 'REPLACE_WITH_SECRET_KEY',
        api_version: 'v1',
        supported_currencies: ['OMR'],
        webhook_url: '/webhooks/thawani',
        checkout_session_path: '/api/v1/checkout/session',
      }),
    },
    {
      name: 'Cash on Delivery',
      code: 'cash_on_delivery',
      api_endpoint: null,
      sandbox_mode: false,
      is_active: true,
      supported_methods: JSON.stringify(['cash']),
      config: JSON.stringify({
        fee: 1.000,
        supported_currencies: ['OMR'],
        max_order_amount: 500.000,
        description: 'Pay in cash when your order is delivered',
        description_ar: 'ادفع نقداً عند استلام طلبك',
      }),
    },
    {
      name: 'Bank Transfer',
      code: 'bank_transfer',
      api_endpoint: null,
      sandbox_mode: false,
      is_active: true,
      supported_methods: JSON.stringify(['bank_transfer']),
      config: JSON.stringify({
        bank_name: process.env.BANK_TRANSFER_BANK_NAME || 'Bank of Oman',
        account_name: process.env.BANK_TRANSFER_ACCOUNT_NAME || 'BHD Marketplace LLC',
        account_number: process.env.BANK_TRANSFER_ACCOUNT_NUMBER || 'REPLACE_WITH_ACCOUNT_NUMBER',
        iban: process.env.BANK_TRANSFER_IBAN || 'REPLACE_WITH_IBAN',
        supported_currencies: ['OMR'],
        instructions: 'Please transfer the amount and upload the receipt',
        instructions_ar: 'يرجى تحويل المبلغ ورفع الإيصال',
      }),
    },
  ];

  for (const gateway of gateways) {
    const existing = await dataSource.query(
      `SELECT id FROM payment_gateways WHERE code = $1 LIMIT 1`,
      [gateway.code]
    );

    if (existing.length === 0) {
      await dataSource.query(`
        INSERT INTO payment_gateways 
          (name, code, api_endpoint, sandbox_mode, is_active, supported_methods, config)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
      `, [
        gateway.name, gateway.code, gateway.api_endpoint,
        gateway.sandbox_mode, gateway.is_active,
        gateway.supported_methods, gateway.config,
      ]);
      console.log(`  Payment gateway created: ${gateway.name}`);
    } else {
      console.log(`  Payment gateway exists: ${gateway.name}`);
    }
  }

  console.log('Payment gateways seeded successfully');
}

/**
 * Seed shipping carriers
 */
async function seedShippingCarriers(dataSource: DataSource): Promise<void> {
  console.log('Seeding shipping carriers...');

  const carriers = [
    {
      name: 'Oman Post',
      name_ar: 'بريد عمان',
      code: 'oman_post',
      api_endpoint: 'https://api.omanpost.om',
      tracking_url_template: 'https://tracking.omanpost.om/?tracking={tracking_number}',
      is_active: true,
      supports_cod: true,
      config: JSON.stringify({
        domestic_zones: ['muscat', 'batinah', 'dakhiliyah', 'dhahirah', 'sharqiyah', 'dhofar', 'buraimi', 'musandam'],
        delivery_time: '2-5 business days',
        base_rate: 2.000,
        rate_per_kg: 0.500,
        max_weight: 30.000,
        free_shipping_threshold: 25.000,
      }),
    },
    {
      name: 'DHL Express Oman',
      name_ar: 'دي إتش إل إكسبريس عمان',
      code: 'dhl_oman',
      api_endpoint: 'https://api-eu.dhl.com',
      tracking_url_template: 'https://www.dhl.com/om-en/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}',
      is_active: true,
      supports_cod: false,
      config: JSON.stringify({
        domestic_zones: ['all'],
        international: true,
        delivery_time: '1-3 business days',
        base_rate: 5.000,
        rate_per_kg: 1.500,
        max_weight: 70.000,
        insurance_available: true,
      }),
    },
    {
      name: 'Aramex Oman',
      name_ar: 'أرامكس عمان',
      code: 'aramex_oman',
      api_endpoint: 'https://ws.aramex.net',
      tracking_url_template: 'https://www.aramex.com/track?track={tracking_number}',
      is_active: true,
      supports_cod: true,
      config: JSON.stringify({
        domestic_zones: ['all'],
        international: true,
        delivery_time: '1-3 business days domestic, 3-7 international',
        base_rate: 3.500,
        rate_per_kg: 1.000,
        max_weight: 50.000,
        free_shipping_threshold: 50.000,
        insurance_available: true,
      }),
    },
    {
      name: 'Local Delivery (Muscat)',
      name_ar: 'توصيل محلي (مسقط)',
      code: 'local_delivery_muscat',
      api_endpoint: null,
      tracking_url_template: null,
      is_active: true,
      supports_cod: true,
      config: JSON.stringify({
        domestic_zones: ['muscat'],
        delivery_time: 'Same day or next day',
        base_rate: 1.500,
        rate_per_kg: 0.250,
        max_weight: 20.000,
        free_shipping_threshold: 15.000,
        same_day_available: true,
        same_day_cutoff: '14:00',
        same_day_fee: 3.000,
      }),
    },
  ];

  for (const carrier of carriers) {
    const existing = await dataSource.query(
      `SELECT id FROM shipping_carriers WHERE code = $1 LIMIT 1`,
      [carrier.code]
    );

    if (existing.length === 0) {
      await dataSource.query(`
        INSERT INTO shipping_carriers 
          (name, name_ar, code, api_endpoint, tracking_url_template, is_active, supports_cod, config)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        carrier.name, carrier.name_ar, carrier.code, carrier.api_endpoint,
        carrier.tracking_url_template, carrier.is_active, carrier.supports_cod,
        carrier.config,
      ]);
      console.log(`  Shipping carrier created: ${carrier.name}`);
    } else {
      console.log(`  Shipping carrier exists: ${carrier.name}`);
    }
  }

  console.log('Shipping carriers seeded successfully');
}
