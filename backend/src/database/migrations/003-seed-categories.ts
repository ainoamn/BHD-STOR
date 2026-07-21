import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCategories003 implements MigrationInterface {
  name = 'SeedCategories003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =====================================================================
    // MAIN CATEGORIES (Level 1)
    // =====================================================================
    await queryRunner.query(`
      INSERT INTO categories (name, name_ar, slug, description, description_ar, icon, sort_order, is_active)
      VALUES 
        ('Electronics', 'إلكترونيات', 'electronics', 'Electronic devices, gadgets, and accessories', 'الأجهزة الإلكترونية والأدوات والملحقات', 'Monitor', 1, true),
        
        ('Fashion', 'أزياء', 'fashion', 'Clothing, shoes, and accessories for men, women, and kids', 'ملابس وأحذية وإكسسوارات للرجال والنساء والأطفال', 'Shirt', 2, true),
        
        ('Home & Living', 'المنزل والمعيشة', 'home-living', 'Furniture, home decor, kitchen appliances, and bedding', 'أثاث وديكور المنزل وأجهزة المطبخ والمفروشات', 'Home', 3, true),
        
        ('Beauty & Personal Care', 'الجمال والعناية الشخصية', 'beauty-personal-care', 'Skincare, haircare, makeup, and personal care products', 'العناية بالبشرة والشعر والمكياج ومنتجات العناية الشخصية', 'Sparkles', 4, true),
        
        ('Sports & Outdoors', 'رياضة وخارجية', 'sports-outdoors', 'Sports equipment, fitness gear, and outdoor accessories', 'معدات رياضية وأدوات لياقة بدنية وإكسسوارات خارجية', 'Dumbbell', 5, true),
        
        ('Toys & Games', 'ألعاب', 'toys-games', 'Toys, games, and educational products for children', 'ألعاب وألعاب تعليمية للأطفال', 'Gamepad2', 6, true),
        
        ('Food & Grocery', 'مواد غذائية', 'food-grocery', 'Fresh food, groceries, beverages, and household essentials', 'الطعام الطازج والبقالة والمشروبات والأساسيات المنزلية', 'ShoppingCart', 7, true),
        
        ('Automotive', 'سيارات', 'automotive', 'Car accessories, parts, maintenance tools, and electronics', 'إكسسوارات السيارات والقطع وأدوات الصيانة والإلكترونيات', 'Car', 8, true),
        
        ('Books & Stationery', 'كتب وقرطاسية', 'books-stationery', 'Books, magazines, office supplies, and stationery', 'الكتب والمجلات ومستلزمات المكتب والقرطاسية', 'BookOpen', 9, true),
        
        ('Health & Wellness', 'الصحة والعافية', 'health-wellness', 'Vitamins, supplements, medical devices, and wellness products', 'الفيتامينات والمكملات الغذائية والأجهزة الطبية ومنتجات العافية', 'Heart', 10, true)
      ON CONFLICT (slug) DO NOTHING;
    `);

    // =====================================================================
    // SUB-CATEGORIES: Electronics
    // =====================================================================
    const electronicsId = await queryRunner.query(`SELECT id FROM categories WHERE slug = 'electronics'`);
    if (electronicsId.length > 0) {
      const parentId = electronicsId[0].id;
      await queryRunner.query(`
        INSERT INTO categories (name, name_ar, slug, description, description_ar, parent_id, icon, sort_order, is_active)
        VALUES 
          ('Mobile Phones', 'هواتف محمولة', 'mobile-phones', 'Smartphones and feature phones from all major brands', 'الهواتف الذكية والهواتف المميزة من جميع العلامات التجارية الرئيسية', '${parentId}', 'Smartphone', 1, true),
          ('Laptops & Computers', 'أجهزة الكمبيوتر المحمولة والكمبيوتر', 'laptops-computers', 'Laptops, desktops, monitors, and computer accessories', 'أجهزة الكمبيوتر المحمولة وأجهزة سطح المكتب والشاشات وملحقات الكمبيوتر', '${parentId}', 'Laptop', 2, true),
          ('Audio & Headphones', 'صوت وسماعات', 'audio-headphones', 'Headphones, earbuds, speakers, and audio equipment', 'السماعات وسماعات الأذن والمكبرات الصوتية ومعدات الصوت', '${parentId}', 'Headphones', 3, true),
          ('Cameras & Photography', 'كاميرات وتصوير', 'cameras-photography', 'Digital cameras, lenses, drones, and photography accessories', 'الكاميرات الرقمية والعدسات والطائرات بدون طيار وإكسسوارات التصوير', '${parentId}', 'Camera', 4, true),
          ('Gaming', 'ألعاب فيديو', 'gaming', 'Gaming consoles, games, controllers, and gaming accessories', 'أجهزة الألعاب والألعاب وأجهزة التحكم وإكسسوارات الألعاب', '${parentId}', 'Gamepad2', 5, true),
          ('Smart Home', 'المنزل الذكي', 'smart-home', 'Smart speakers, security cameras, smart lighting, and home automation', 'مكبرات الصوت الذكية وكاميرات الأمان والإضاءة الذكية وأتمتة المنزل', '${parentId}', 'Home', 6, true),
          ('Wearable Technology', 'التقنية القابلة للارتداء', 'wearable-technology', 'Smartwatches, fitness trackers, and wearable devices', 'الساعات الذكية وأساور اللياقة البدنية والأجهزة القابلة للارتداء', '${parentId}', 'Watch', 7, true),
          ('TV & Entertainment', 'تلفاز وترفيه', 'tv-entertainment', 'TVs, projectors, streaming devices, and home theater systems', 'التلفزيونات وأجهزة العرض وأجهزة البث وأنظمة المسرح المنزلي', '${parentId}', 'Tv', 8, true)
        ON CONFLICT (slug) DO NOTHING;
      `);
    }

    // =====================================================================
    // SUB-CATEGORIES: Fashion
    // =====================================================================
    const fashionId = await queryRunner.query(`SELECT id FROM categories WHERE slug = 'fashion'`);
    if (fashionId.length > 0) {
      const parentId = fashionId[0].id;
      await queryRunner.query(`
        INSERT INTO categories (name, name_ar, slug, description, description_ar, parent_id, icon, sort_order, is_active)
        VALUES 
          ('Men\'s Clothing', 'ملابس رجالية', 'mens-clothing', 'Shirts, pants, traditional wear, and more for men', 'قمصان وبناطيل وملابس تقليدية وأكثر للرجال', '${parentId}', 'Shirt', 1, true),
          ('Women\'s Clothing', 'ملابس نسائية', 'womens-clothing', 'Dresses, abayas, casual and formal wear for women', 'فساتين وعبايات وملابس كاجوال ورسمية للنساء', '${parentId}', 'Dress', 2, true),
          ('Kids Clothing', 'ملابس أطفال', 'kids-clothing', 'Clothing for boys and girls of all ages', 'ملابس للأولاد والبنات من جميع الأعمار', '${parentId}', 'Baby', 3, true),
          ('Shoes', 'أحذية', 'shoes', 'Sneakers, formal shoes, sandals, and boots', 'أحذية رياضية ورسمية وصنادل وبوتات', '${parentId}', 'Footprints', 4, true),
          ('Bags & Luggage', 'حقائب وأمتعة', 'bags-luggage', 'Handbags, backpacks, suitcases, and travel bags', 'حقائب يد وحقائب ظهر وحقائب سفر وحقائب السفر', '${parentId}', 'BaggageClaim', 5, true),
          ('Jewelry & Watches', 'مجوهرات وساعات', 'jewelry-watches', 'Rings, necklaces, bracelets, and watches', 'خواتم وقلائد وأساور وساعات', '${parentId}', 'Gem', 6, true),
          ('Accessories', 'إكسسوارات', 'fashion-accessories', 'Belts, scarves, hats, sunglasses, and more', 'أحزمة ووشاحات وقبعات ونظارات شمسية وأكثر', '${parentId}', 'Glasses', 7, true)
        ON CONFLICT (slug) DO NOTHING;
      `);
    }

    // =====================================================================
    // SUB-CATEGORIES: Home & Living
    // =====================================================================
    const homeId = await queryRunner.query(`SELECT id FROM categories WHERE slug = 'home-living'`);
    if (homeId.length > 0) {
      const parentId = homeId[0].id;
      await queryRunner.query(`
        INSERT INTO categories (name, name_ar, slug, description, description_ar, parent_id, icon, sort_order, is_active)
        VALUES 
          ('Furniture', 'أثاث', 'furniture', 'Sofas, beds, tables, chairs, and storage solutions', 'الكنبات والأسرة والطاولات والكراسي وحلول التخزين', '${parentId}', 'Sofa', 1, true),
          ('Home Decor', 'ديكور المنزل', 'home-decor', 'Wall art, vases, candles, and decorative items', 'لوحات جدارية ومزهريات وشموع وقطع زخرفية', '${parentId}', 'Paintbrush', 2, true),
          ('Kitchen & Dining', 'مطبخ وطعام', 'kitchen-dining', 'Cookware, utensils, dinnerware, and kitchen appliances', 'أدوات الطبخ والأواني وأدوات المائدة وأجهزة المطبخ', '${parentId}', 'ChefHat', 3, true),
          ('Bedding & Bath', 'مفروشات وحمام', 'bedding-bath', 'Sheets, blankets, towels, and bathroom accessories', 'ملاءات وبطانيات وفواط وإكسسوارات الحمام', '${parentId}', 'Bed', 4, true),
          ('Lighting', 'إضاءة', 'lighting', 'Ceiling lights, lamps, outdoor lighting, and bulbs', 'أضواء السقف والمصابيح والإضاءة الخارجية والمصابيح', '${parentId}', 'Lightbulb', 5, true),
          ('Storage & Organization', 'تخزين وتنظيم', 'storage-organization', 'Shelving, baskets, organizers, and storage containers', 'أرفف وسلال ومنظمات وحاويات التخزين', '${parentId}', 'Archive', 6, true)
        ON CONFLICT (slug) DO NOTHING;
      `);
    }

    // =====================================================================
    // SUB-CATEGORIES: Food & Grocery
    // =====================================================================
    const foodId = await queryRunner.query(`SELECT id FROM categories WHERE slug = 'food-grocery'`);
    if (foodId.length > 0) {
      const parentId = foodId[0].id;
      await queryRunner.query(`
        INSERT INTO categories (name, name_ar, slug, description, description_ar, parent_id, icon, sort_order, is_active)
        VALUES 
          ('Fresh Produce', 'منتجات طازجة', 'fresh-produce', 'Fresh fruits, vegetables, and herbs', 'فواكه وخضروات وأعشاب طازجة', '${parentId}', 'Apple', 1, true),
          ('Meat & Seafood', 'لحوم ومأكولات بحرية', 'meat-seafood', 'Fresh and frozen meat, poultry, and seafood', 'لحوم ودواجن ومأكولات بحرية طازجة ومجمدة', '${parentId}', 'Beef', 2, true),
          ('Dairy & Eggs', 'ألبان وبيض', 'dairy-eggs', 'Milk, cheese, yogurt, butter, and eggs', 'حليب وجبن وزبدة وبيض', '${parentId}', 'Milk', 3, true),
          ('Beverages', 'مشروبات', 'beverages', 'Coffee, tea, juices, soft drinks, and water', 'قهوة وشاي وعصائر ومشروبات غازية وماء', '${parentId}', 'Coffee', 4, true),
          ('Snacks & Sweets', 'وجبات خفيفة وحلويات', 'snacks-sweets', 'Chips, cookies, chocolates, and traditional Omani sweets', 'شيبس وبسكويت وشوكولاتة وحلويات عمانية تقليدية', '${parentId}', 'Cookie', 5, true),
          ('Rice, Pasta & Grains', 'أرز ومعكرونة وحبوب', 'rice-pasta-grains', 'Rice, pasta, lentils, beans, and cereals', 'أرز ومعكرونة وعدس وفاصوليا وحبوب', '${parentId}', 'Wheat', 6, true),
          ('Omani Specialties', 'منتجات عمانية خاصة', 'omani-specialties', 'Traditional Omani products, halwa, dates, and honey', 'منتجات عمانية تقليدية وحلوى عمانية وتمور وعسل', '${parentId}', 'Flag', 7, true)
        ON CONFLICT (slug) DO NOTHING;
      `);
    }

    // Verify seed
    const count = await queryRunner.query(`SELECT COUNT(*) FROM categories`);
    console.log(`Seeded ${count[0].count} categories`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete sub-categories first (children)
    await queryRunner.query(`DELETE FROM categories WHERE parent_id IS NOT NULL`);
    // Delete main categories
    await queryRunner.query(`DELETE FROM categories WHERE parent_id IS NULL`);
  }
}
