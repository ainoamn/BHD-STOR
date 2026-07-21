/**
 * BHD Oman WhatsApp Bot Commands
 * All available bot commands with their handlers and metadata
 */

export interface Command {
  name: string;
  description: string;
  descriptionAr: string;
  usage: string;
  examples: string[];
  category: 'general' | 'shopping' | 'orders' | 'support';
  requiresAuth: boolean;
  handler: (args: string[], context: CommandContext) => Promise<CommandResponse>;
}

export interface CommandContext {
  userId?: string;
  phone: string;
  profileName?: string;
  language: 'en' | 'ar';
  conversationId: string;
  previousCommand?: string;
  userState?: Record<string, any>;
}

export interface CommandResponse {
  message: string;
  messageAr?: string;
  type: 'text' | 'interactive' | 'product_list' | 'order_status' | 'menu';
  buttons?: Array<{ id: string; title: string }>;
  products?: any[];
  actions?: Array<{ type: string; payload: any }>;
  nextCommand?: string;
}

// ─── Command Definitions ──────────────────────────────────────────

export const COMMANDS: Record<string, Command> = {
  // ─── General Commands ───────────────────────────────────────────

  start: {
    name: 'start',
    description: 'Start the BHD Oman assistant and show welcome message',
    descriptionAr: 'بدء مساعد BHD عمان وعرض رسالة الترحيب',
    usage: '/start',
    examples: ['/start'],
    category: 'general',
    requiresAuth: false,
    handler: async (args, ctx) => {
      const welcome = `👋 Welcome to *BHD Oman* - Your Premier E-Commerce Marketplace!

I'm your personal shopping assistant. I can help you:
🛍️ Browse and search products
📦 Track your orders
🛒 Manage your cart
❓ Get support

How can I assist you today?`;

      const welcomeAr = `👋 أهلاً بك في *BHD عمان* - سوق التجارة الإلكترونية الرائد!

أنا مساعدك الشخصي للتسوق. يمكنني مساعدتك في:
🛍️ تصفح وبحث المنتجات
📦 تتبع طلباتك
🛒 إدارة سلة التسوق
❓ الحصول على الدعم

كيف يمكنني مساعدتك اليوم؟`;

      return {
        message: welcome,
        messageAr: welcomeAr,
        type: 'menu',
        buttons: [
          { id: 'cmd_products', title: '🛍️ Browse Products' },
          { id: 'cmd_order', title: '📦 Track Order' },
          { id: 'cmd_cart', title: '🛒 My Cart' },
          { id: 'cmd_support', title: '❓ Support' },
        ],
      };
    },
  },

  help: {
    name: 'help',
    description: 'Show all available commands',
    descriptionAr: 'عرض جميع الأوامر المتاحة',
    usage: '/help',
    examples: ['/help'],
    category: 'general',
    requiresAuth: false,
    handler: async (args, ctx) => {
      const helpText = `*📋 BHD Oman Bot Commands*

*Shopping:*
/products [search] - Search products
/cart - View your cart
/checkout - Proceed to checkout
/stores - Browse stores

*Orders:*
/order [orderId] - Check order status
/track [trackingNumber] - Track shipment

*General:*
/start - Welcome message
/help - This help menu
/language - Change language

*Support:*
/support - Contact support

Type any command to get started!`;

      const helpAr = `*📋 أوامر بوت BHD عمان*

*التسوق:*
/products [بحث] - البحث عن منتجات
/cart - عرض سلة التسوق
/checkout - متابعة الدفع
/stores - تصفح المتاجر

*الطلبات:*
/order [رقم الطلب] - تحقق من حالة الطلب
/track [رقم التتبع] - تتبع الشحنة

*عام:*
/start - رسالة الترحيب
/help - قائمة المساعدة
/language - تغيير اللغة

*الدعم:*
/support - التواصل مع الدعم

اكتب أي أمر للبدء!`;

      return {
        message: helpText,
        messageAr: helpAr,
        type: 'text',
      };
    },
  },

  language: {
    name: 'language',
    description: 'Change your preferred language',
    descriptionAr: 'تغيير اللغة المفضلة',
    usage: '/language [en|ar]',
    examples: ['/language en', '/language ar'],
    category: 'general',
    requiresAuth: false,
    handler: async (args, ctx) => {
      const lang = args[0]?.toLowerCase();

      if (lang === 'en' || lang === 'english') {
        return {
          message: '✅ Language set to *English*. How can I help you?',
          type: 'menu',
          buttons: [
            { id: 'cmd_products', title: '🛍️ Browse Products' },
            { id: 'cmd_order', title: '📦 My Orders' },
            { id: 'cmd_cart', title: '🛒 My Cart' },
          ],
          actions: [{ type: 'set_language', payload: 'en' }],
        };
      }

      if (lang === 'ar' || lang === 'arabic' || lang === 'العربية') {
        return {
          message: '✅ تم تعيين اللغة إلى *العربية*. كيف يمكنني مساعدتك؟',
          type: 'menu',
          buttons: [
            { id: 'cmd_products', title: '🛍️ تصفح المنتجات' },
            { id: 'cmd_order', title: '📦 طلباتي' },
            { id: 'cmd_cart', title: '🛒 سلة التسوق' },
          ],
          actions: [{ type: 'set_language', payload: 'ar' }],
        };
      }

      return {
        message: 'Please select your preferred language:\n\nيرجى اختيار لغتك المفضلة:',
        type: 'interactive',
        buttons: [
          { id: 'lang_en', title: '🇬🇧 English' },
          { id: 'lang_ar', title: '🇸🇦 العربية' },
        ],
      };
    },
  },

  // ─── Shopping Commands ──────────────────────────────────────────

  products: {
    name: 'products',
    description: 'Search and browse products',
    descriptionAr: 'البحث وتصفح المنتجات',
    usage: '/products [search query]',
    examples: ['/products', '/products iPhone', '/products headphones'],
    category: 'shopping',
    requiresAuth: false,
    handler: async (args, ctx) => {
      const searchQuery = args.join(' ');

      if (!searchQuery) {
        return {
          message: `*🛍️ Browse Categories*

What are you looking for? Choose a category or type your search:`,
          type: 'interactive',
          buttons: [
            { id: 'cat_electronics', title: '📱 Electronics' },
            { id: 'cat_fashion', title: '👗 Fashion' },
            { id: 'cat_home', title: '🏠 Home & Living' },
            { id: 'cat_beauty', title: '💄 Beauty' },
            { id: 'cat_groceries', title: '🥘 Groceries' },
            { id: 'cat_sports', title: '⚽ Sports' },
          ],
        };
      }

      // Return search results format (actual search done in BotEngine)
      return {
        message: `🔍 Searching for "*${searchQuery}*"...`,
        type: 'product_list',
        actions: [{ type: 'search_products', payload: { query: searchQuery, userId: ctx.userId } }],
        nextCommand: 'products',
      };
    },
  },

  cart: {
    name: 'cart',
    description: 'View your shopping cart',
    descriptionAr: 'عرض سلة التسوق',
    usage: '/cart',
    examples: ['/cart'],
    category: 'shopping',
    requiresAuth: true,
    handler: async (args, ctx) => {
      return {
        message: `*🛒 Your Shopping Cart*\n\nLoading your cart items...`,
        type: 'interactive',
        actions: [{ type: 'get_cart', payload: { userId: ctx.userId } }],
        buttons: [
          { id: 'cart_view', title: '📋 View Items' },
          { id: 'cart_checkout', title: '💳 Checkout' },
          { id: 'cart_clear', title: '🗑️ Clear Cart' },
        ],
      };
    },
  },

  checkout: {
    name: 'checkout',
    description: 'Proceed to checkout',
    descriptionAr: 'المتابعة إلى الدفع',
    usage: '/checkout',
    examples: ['/checkout'],
    category: 'shopping',
    requiresAuth: true,
    handler: async (args, ctx) => {
      return {
        message: `*💳 Checkout*\n\nPlease choose a payment method:`,
        type: 'interactive',
        buttons: [
          { id: 'pay_card', title: '💳 Credit/Debit Card' },
          { id: 'pay_apple', title: '🍎 Apple Pay' },
          { id: 'pay_google', title: '🔵 Google Pay' },
          { id: 'pay_cod', title: '💵 Cash on Delivery' },
        ],
        actions: [{ type: 'initiate_checkout', payload: { userId: ctx.userId } }],
      };
    },
  },

  stores: {
    name: 'stores',
    description: 'Browse stores on BHD Oman',
    descriptionAr: 'تصفح المتاجر في BHD عمان',
    usage: '/stores [category]',
    examples: ['/stores', '/stores electronics'],
    category: 'shopping',
    requiresAuth: false,
    handler: async (args, ctx) => {
      return {
        message: `*🏪 BHD Oman Stores*\n\nDiscover trusted sellers on our marketplace:\n
⭐ *Featured Stores:*
• TechWorld Oman - Electronics
• Fashion Hub - Clothing & Accessories  
• Home Comfort - Home & Living
• Beauty Box - Cosmetics
• FreshMart - Groceries

Browse by category or view all stores:`,
        type: 'interactive',
        buttons: [
          { id: 'stores_featured', title: '⭐ Featured' },
          { id: 'stores_all', title: '🏪 All Stores' },
          { id: 'stores_nearby', title: '📍 Nearby' },
        ],
        actions: [{ type: 'browse_stores', payload: { category: args[0] } }],
      };
    },
  },

  // ─── Order Commands ─────────────────────────────────────────────

  order: {
    name: 'order',
    description: 'Check your order status',
    descriptionAr: 'التحقق من حالة الطلب',
    usage: '/order [orderId]',
    examples: ['/order', '/order ORD-2024-001'],
    category: 'orders',
    requiresAuth: true,
    handler: async (args, ctx) => {
      const orderId = args[0];

      if (!orderId) {
        return {
          message: `*📦 Your Orders*\n\nPlease provide your order ID, or view recent orders:`,
          type: 'interactive',
          buttons: [
            { id: 'orders_recent', title: '📋 Recent Orders' },
            { id: 'orders_all', title: '📑 All Orders' },
          ],
          actions: [{ type: 'get_orders', payload: { userId: ctx.userId } }],
        };
      }

      return {
        message: `📦 Checking order *${orderId}*...`,
        type: 'order_status',
        actions: [{ type: 'get_order_status', payload: { orderId, userId: ctx.userId } }],
      };
    },
  },

  track: {
    name: 'track',
    description: 'Track your shipment',
    descriptionAr: 'تتبع شحنتك',
    usage: '/track [trackingNumber]',
    examples: ['/track TRK123456', '/track'],
    category: 'orders',
    requiresAuth: false,
    handler: async (args, ctx) => {
      const trackingNumber = args[0];

      if (!trackingNumber) {
        return {
          message: `*📍 Shipment Tracking*\n\nPlease provide your tracking number:\n\nExample: \`/track TRK123456\``,
          type: 'text',
          nextCommand: 'track',
        };
      }

      return {
        message: `📍 Tracking shipment *${trackingNumber}*...`,
        type: 'order_status',
        actions: [{ type: 'track_shipment', payload: { trackingNumber, userId: ctx.userId } }],
      };
    },
  },

  // ─── Support Commands ───────────────────────────────────────────

  support: {
    name: 'support',
    description: 'Contact customer support',
    descriptionAr: 'التواصل مع خدمة العملاء',
    usage: '/support [message]',
    examples: ['/support', '/support I have an issue with my order'],
    category: 'support',
    requiresAuth: false,
    handler: async (args, ctx) => {
      const message = args.join(' ');

      if (!message) {
        return {
          message: `*❓ Customer Support*\n\nHow can we help you today?`,
          type: 'interactive',
          buttons: [
            { id: 'support_order', title: '📦 Order Issues' },
            { id: 'support_refund', title: '💰 Refunds' },
            { id: 'support_account', title: '👤 Account' },
            { id: 'support_technical', title: '🔧 Technical' },
            { id: 'support_other', title: '📝 Other' },
          ],
        };
      }

      // Create support ticket
      return {
        message: `✅ *Support ticket created!*\n\nYour message has been forwarded to our support team. We'll get back to you shortly.\n\nTicket reference: *SUP-${Date.now().toString(36).toUpperCase()}*\n\n_For urgent matters, call: +968 1234 5678_`,
        type: 'text',
        actions: [{ type: 'create_support_ticket', payload: { message, userId: ctx.userId, phone: ctx.phone } }],
      };
    },
  },
};

// ─── Quick Replies / Shortcuts ────────────────────────────────────

export const QUICK_REPLIES: Record<string, { command: string; args: string[] }> = {
  // Language selection
  lang_en: { command: 'language', args: ['en'] },
  lang_ar: { command: 'language', args: ['ar'] },

  // Menu navigation
  cmd_products: { command: 'products', args: [] },
  cmd_order: { command: 'order', args: [] },
  cmd_cart: { command: 'cart', args: [] },
  cmd_checkout: { command: 'checkout', args: [] },
  cmd_support: { command: 'support', args: [] },
  cmd_help: { command: 'help', args: [] },
  cmd_stores: { command: 'stores', args: [] },

  // Category shortcuts
  cat_electronics: { command: 'products', args: ['electronics'] },
  cat_fashion: { command: 'products', args: ['fashion'] },
  cat_home: { command: 'products', args: ['home living'] },
  cat_beauty: { command: 'products', args: ['beauty'] },
  cat_groceries: { command: 'products', args: ['groceries'] },
  cat_sports: { command: 'products', args: ['sports'] },

  // Cart actions
  cart_view: { command: 'cart', args: [] },
  cart_checkout: { command: 'checkout', args: [] },

  // Support categories
  support_order: { command: 'support', args: ['Order issue'] },
  support_refund: { command: 'support', args: ['Refund request'] },
  support_account: { command: 'support', args: ['Account help'] },
  support_technical: { command: 'support', args: ['Technical issue'] },
  support_other: { command: 'support', args: ['Other inquiry'] },
};

// ─── Utility Functions ────────────────────────────────────────────

export function getCommandList(language: 'en' | 'ar' = 'en'): string {
  const commands = Object.values(COMMANDS);
  return commands
    .map((cmd) => {
      const desc = language === 'ar' ? cmd.descriptionAr : cmd.description;
      return `*/${cmd.name}* - ${desc}`;
    })
    .join('\n');
}

export function findCommand(input: string): { command: Command; args: string[] } | null {
  // Check for /command format
  if (input.startsWith('/')) {
    const parts = input.slice(1).split(' ');
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (COMMANDS[name]) {
      return { command: COMMANDS[name], args };
    }
  }

  // Check for button payload format
  if (QUICK_REPLIES[input]) {
    const qr = QUICK_REPLIES[input];
    if (COMMANDS[qr.command]) {
      return { command: COMMANDS[qr.command], args: qr.args };
    }
  }

  return null;
}

export function getWelcomeMessage(language: 'en' | 'ar' = 'en', name?: string): string {
  const greeting = name ? `Hello ${name}!` : 'Hello!';
  const greetingAr = name ? `أهلاً ${name}!` : 'أهلاً بك!';

  if (language === 'ar') {
    return `${greetingAr} 👋\n\nمرحباً بك في *BHD عمان* - وجهتك الرئيسية للتسوق الإلكتروني في سلطنة عمان.\n\nيمكنني مساعدتك في:\n🛍️ البحث عن المنتجات\n📦 تتبع طلباتك\n🛒 إدارة سلة التسوق\n❓ الإجابة على استفساراتك\n\nكيف يمكنني مساعدتك اليوم؟`;
  }

  return `${greeting} 👋\n\nWelcome to *BHD Oman* - Oman's premier e-commerce marketplace.\n\nI can help you:\n🛍️ Search for products\n📦 Track your orders\n🛒 Manage your cart\n❓ Answer your questions\n\nHow can I help you today?`;
}
