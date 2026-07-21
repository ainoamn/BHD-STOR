import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

// In production, these would be actual entity repositories
// Using generic Repository patterns for flexibility

export interface SalesHeatmapData {
  dayOfWeek: number;
  hourOfDay: number;
  sales: number;
  revenue: number;
  dayLabel: string;
}

export interface RFMCustomer {
  customerId: string;
  recency: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  segment: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: Date;
}

export interface ProductAffinity {
  productA: string;
  productB: string;
  support: number;
  confidence: number;
  lift: number;
  frequency: number;
}

export interface ChurnPrediction {
  customerId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastOrderDays: number;
  avgOrderFrequency: number;
  totalSpent: number;
  recommendations: string[];
}

export interface CLVData {
  customerId: string;
  predictedCLV: number;
  historicalValue: number;
  avgOrderValue: number;
  predictedOrders: number;
  retentionProbability: number;
}

export interface CohortData {
  cohortMonth: string;
  cohortSize: number;
  periods: {
    period: number;
    activeUsers: number;
    retentionRate: number;
    revenue: number;
  }[];
}

export interface GeoSalesData {
  country: string;
  region: string;
  city: string;
  totalSales: number;
  totalRevenue: number;
  avgOrderValue: number;
  customerCount: number;
  lat: number;
  lng: number;
}

export interface SeasonalTrend {
  month: number;
  monthName: string;
  year: number;
  totalSales: number;
  totalRevenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  growthRate: number;
}

export interface RealTimeStat {
  metric: string;
  value: number;
  change: number;
  changeType: 'up' | 'down' | 'neutral';
  timestamp: Date;
}

@Injectable()
export class AdvancedAnalyticsService {
  constructor(
    @InjectRepository(require('../../orders/entities/order.entity').Order)
    private readonly orderRepo: Repository<any>,
    @InjectRepository(require('../../crm/entities/customer-contact.entity').CustomerContact)
    private readonly customerRepo: Repository<any>,
  ) {}

  // ─── 1. Sales Heatmap ──────────────────────────────────────────

  async getSalesHeatmap(
    startDate?: Date,
    endDate?: Date,
  ): Promise<SalesHeatmapData[]> {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const end = endDate || now;

    // Query orders grouped by day of week and hour
    const orders = await this.orderRepo.find({
      where: { createdAt: Between(start, end), status: 'completed' },
      select: ['createdAt', 'total', 'id'],
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmapMap = new Map<string, { sales: number; revenue: number }>();

    // Initialize all cells
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        heatmapMap.set(`${d}-${h}`, { sales: 0, revenue: 0 });
      }
    }

    for (const order of orders) {
      const date = new Date(order.createdAt);
      const dayOfWeek = date.getDay();
      const hourOfDay = date.getHours();
      const key = `${dayOfWeek}-${hourOfDay}`;
      const cell = heatmapMap.get(key);
      if (cell) {
        cell.sales += 1;
        cell.revenue += Number(order.total || 0);
      }
    }

    const result: SalesHeatmapData[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const cell = heatmapMap.get(`${d}-${h}`)!;
        result.push({
          dayOfWeek: d,
          hourOfDay: h,
          sales: cell.sales,
          revenue: cell.revenue,
          dayLabel: dayLabels[d],
        });
      }
    }

    return result;
  }

  // ─── 2. Customer Segmentation (RFM) ────────────────────────────

  async getCustomerSegments(): Promise<RFMCustomer[]> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // In production: aggregate order data per customer
    // Mock data for demonstration
    const segments: RFMCustomer[] = [
      {
        customerId: 'cust-001',
        recency: 5,
        frequency: 24,
        monetary: 8500,
        rScore: 5,
        fScore: 5,
        mScore: 5,
        segment: 'Champions',
        totalSpent: 12500,
        orderCount: 24,
        lastOrderDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: 'cust-002',
        recency: 12,
        frequency: 15,
        monetary: 5200,
        rScore: 4,
        fScore: 4,
        mScore: 4,
        segment: 'Loyal Customers',
        totalSpent: 8200,
        orderCount: 15,
        lastOrderDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: 'cust-003',
        recency: 45,
        frequency: 3,
        monetary: 1200,
        rScore: 2,
        fScore: 2,
        mScore: 3,
        segment: 'At Risk',
        totalSpent: 1800,
        orderCount: 3,
        lastOrderDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: 'cust-004',
        recency: 2,
        frequency: 2,
        monetary: 350,
        rScore: 5,
        fScore: 1,
        mScore: 1,
        segment: 'New Customers',
        totalSpent: 450,
        orderCount: 2,
        lastOrderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: 'cust-005',
        recency: 90,
        frequency: 8,
        monetary: 3200,
        rScore: 1,
        fScore: 3,
        mScore: 4,
        segment: 'Hibernating',
        totalSpent: 5600,
        orderCount: 8,
        lastOrderDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: 'cust-006',
        recency: 8,
        frequency: 18,
        monetary: 9800,
        rScore: 4,
        fScore: 5,
        mScore: 5,
        segment: 'Champions',
        totalSpent: 15200,
        orderCount: 18,
        lastOrderDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: 'cust-007',
        recency: 30,
        frequency: 6,
        monetary: 2100,
        rScore: 3,
        fScore: 3,
        mScore: 3,
        segment: 'Potential Loyalists',
        totalSpent: 3200,
        orderCount: 6,
        lastOrderDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: 'cust-008',
        recency: 3,
        frequency: 1,
        monetary: 800,
        rScore: 5,
        fScore: 1,
        mScore: 2,
        segment: 'New Customers',
        totalSpent: 800,
        orderCount: 1,
        lastOrderDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    return segments;
  }

  // ─── 3. Product Affinity ───────────────────────────────────────

  async getProductAffinity(minSupport = 0.01): Promise<ProductAffinity[]> {
    // Market basket analysis - frequently bought together
    // In production: use Apriori or FP-Growth algorithm on order items
    const affinities: ProductAffinity[] = [
      {
        productA: 'Wireless Headphones',
        productB: 'Phone Case',
        support: 0.15,
        confidence: 0.68,
        lift: 2.3,
        frequency: 342,
      },
      {
        productA: 'Laptop Stand',
        productB: 'Wireless Mouse',
        support: 0.12,
        confidence: 0.72,
        lift: 2.8,
        frequency: 278,
      },
      {
        productA: 'Running Shoes',
        productB: 'Sports Socks',
        support: 0.22,
        confidence: 0.81,
        lift: 3.1,
        frequency: 521,
      },
      {
        productA: 'Coffee Maker',
        productB: 'Coffee Beans',
        support: 0.35,
        confidence: 0.89,
        lift: 4.2,
        frequency: 812,
      },
      {
        productA: 'Yoga Mat',
        productB: 'Water Bottle',
        support: 0.18,
        confidence: 0.65,
        lift: 2.1,
        frequency: 423,
      },
      {
        productA: 'Desk Lamp',
        productB: 'USB Hub',
        support: 0.08,
        confidence: 0.52,
        lift: 1.8,
        frequency: 198,
      },
      {
        productA: 'Bluetooth Speaker',
        productB: 'Charging Cable',
        support: 0.25,
        confidence: 0.74,
        lift: 2.6,
        frequency: 612,
      },
      {
        productA: 'Backpack',
        productB: 'Laptop Sleeve',
        support: 0.14,
        confidence: 0.61,
        lift: 2.0,
        frequency: 356,
      },
    ];

    return affinities.filter((a) => a.support >= minSupport);
  }

  // ─── 4. Churn Prediction ───────────────────────────────────────

  async getChurnPrediction(): Promise<ChurnPrediction[]> {
    const now = new Date();

    const predictions: ChurnPrediction[] = [
      {
        customerId: 'cust-003',
        churnProbability: 0.82,
        riskLevel: 'critical',
        lastOrderDays: 87,
        avgOrderFrequency: 15,
        totalSpent: 1850,
        recommendations: [
          'Send personalized re-engagement email',
          'Offer exclusive discount',
          'Reach out via phone call',
        ],
      },
      {
        customerId: 'cust-005',
        churnProbability: 0.74,
        riskLevel: 'high',
        lastOrderDays: 92,
        avgOrderFrequency: 22,
        totalSpent: 5200,
        recommendations: [
          'Send win-back campaign',
          'Offer loyalty reward',
          'Personal outreach from account manager',
        ],
      },
      {
        customerId: 'cust-009',
        churnProbability: 0.61,
        riskLevel: 'medium',
        lastOrderDays: 45,
        avgOrderFrequency: 30,
        totalSpent: 920,
        recommendations: [
          'Send product recommendations',
          'Offer free shipping',
        ],
      },
      {
        customerId: 'cust-010',
        churnProbability: 0.38,
        riskLevel: 'low',
        lastOrderDays: 28,
        avgOrderFrequency: 35,
        totalSpent: 3100,
        recommendations: [
          'Include in regular newsletter',
          'Monitor engagement',
        ],
      },
      {
        customerId: 'cust-011',
        churnProbability: 0.15,
        riskLevel: 'low',
        lastOrderDays: 5,
        avgOrderFrequency: 10,
        totalSpent: 7800,
        recommendations: [
          'Maintain regular engagement',
          'Upsell premium products',
        ],
      },
    ];

    return predictions.sort((a, b) => b.churnProbability - a.churnProbability);
  }

  // ─── 5. Customer Lifetime Value ─────────────────────────────────

  async getLifetimeValue(): Promise<CLVData[]> {
    const clvData: CLVData[] = [
      {
        customerId: 'cust-001',
        predictedCLV: 28500,
        historicalValue: 12500,
        avgOrderValue: 520,
        predictedOrders: 31,
        retentionProbability: 0.92,
      },
      {
        customerId: 'cust-006',
        predictedCLV: 32100,
        historicalValue: 15200,
        avgOrderValue: 844,
        predictedOrders: 20,
        retentionProbability: 0.88,
      },
      {
        customerId: 'cust-005',
        predictedCLV: 8500,
        historicalValue: 5600,
        avgOrderValue: 700,
        predictedOrders: 4,
        retentionProbability: 0.45,
      },
      {
        customerId: 'cust-002',
        predictedCLV: 16800,
        historicalValue: 8200,
        avgOrderValue: 547,
        predictedOrders: 16,
        retentionProbability: 0.78,
      },
      {
        customerId: 'cust-007',
        predictedCLV: 12400,
        historicalValue: 3200,
        avgOrderValue: 533,
        predictedOrders: 17,
        retentionProbability: 0.72,
      },
      {
        customerId: 'cust-004',
        predictedCLV: 7200,
        historicalValue: 450,
        avgOrderValue: 225,
        predictedOrders: 30,
        retentionProbability: 0.65,
      },
      {
        customerId: 'cust-003',
        predictedCLV: 3100,
        historicalValue: 1800,
        avgOrderValue: 600,
        predictedOrders: 2,
        retentionProbability: 0.22,
      },
      {
        customerId: 'cust-011',
        predictedCLV: 24500,
        historicalValue: 7800,
        avgOrderValue: 780,
        predictedOrders: 21,
        retentionProbability: 0.85,
      },
    ];

    return clvData.sort((a, b) => b.predictedCLV - a.predictedCLV);
  }

  // ─── 6. Cohort Analysis ─────────────────────────────────────────

  async getCohortAnalysis(): Promise<CohortData[]> {
    const cohorts: CohortData[] = [
      {
        cohortMonth: '2024-01',
        cohortSize: 120,
        periods: [
          { period: 0, activeUsers: 120, retentionRate: 100, revenue: 28000 },
          { period: 1, activeUsers: 84, retentionRate: 70, revenue: 19500 },
          { period: 2, activeUsers: 68, retentionRate: 56.7, revenue: 15800 },
          { period: 3, activeUsers: 58, retentionRate: 48.3, revenue: 13400 },
          { period: 4, activeUsers: 52, retentionRate: 43.3, revenue: 11800 },
          { period: 5, activeUsers: 48, retentionRate: 40, revenue: 10600 },
        ],
      },
      {
        cohortMonth: '2024-02',
        cohortSize: 145,
        periods: [
          { period: 0, activeUsers: 145, retentionRate: 100, revenue: 34200 },
          { period: 1, activeUsers: 95, retentionRate: 65.5, revenue: 21800 },
          { period: 2, activeUsers: 76, retentionRate: 52.4, revenue: 17200 },
          { period: 3, activeUsers: 65, retentionRate: 44.8, revenue: 14800 },
          { period: 4, activeUsers: 58, retentionRate: 40, revenue: 12600 },
        ],
      },
      {
        cohortMonth: '2024-03',
        cohortSize: 168,
        periods: [
          { period: 0, activeUsers: 168, retentionRate: 100, revenue: 39500 },
          { period: 1, activeUsers: 118, retentionRate: 70.2, revenue: 26800 },
          { period: 2, activeUsers: 92, retentionRate: 54.8, revenue: 20800 },
          { period: 3, activeUsers: 78, retentionRate: 46.4, revenue: 17200 },
        ],
      },
      {
        cohortMonth: '2024-04',
        cohortSize: 192,
        periods: [
          { period: 0, activeUsers: 192, retentionRate: 100, revenue: 45600 },
          { period: 1, activeUsers: 132, retentionRate: 68.8, revenue: 30200 },
          { period: 2, activeUsers: 102, retentionRate: 53.1, revenue: 23200 },
        ],
      },
      {
        cohortMonth: '2024-05',
        cohortSize: 210,
        periods: [
          { period: 0, activeUsers: 210, retentionRate: 100, revenue: 51200 },
          { period: 1, activeUsers: 152, retentionRate: 72.4, revenue: 36200 },
        ],
      },
      {
        cohortMonth: '2024-06',
        cohortSize: 235,
        periods: [
          { period: 0, activeUsers: 235, retentionRate: 100, revenue: 58900 },
        ],
      },
    ];

    return cohorts;
  }

  // ─── 7. Geographic Analytics ────────────────────────────────────

  async getGeoAnalytics(): Promise<GeoSalesData[]> {
    const geoData: GeoSalesData[] = [
      { country: 'United States', region: 'California', city: 'Los Angeles', totalSales: 1250, totalRevenue: 285000, avgOrderValue: 228, customerCount: 850, lat: 34.0522, lng: -118.2437 },
      { country: 'United States', region: 'New York', city: 'New York', totalSales: 980, totalRevenue: 312000, avgOrderValue: 318, customerCount: 620, lat: 40.7128, lng: -74.006 },
      { country: 'United States', region: 'Texas', city: 'Houston', totalSales: 720, totalRevenue: 168000, avgOrderValue: 233, customerCount: 480, lat: 29.7604, lng: -95.3698 },
      { country: 'United Kingdom', region: 'England', city: 'London', totalSales: 680, totalRevenue: 195000, avgOrderValue: 287, customerCount: 420, lat: 51.5074, lng: -0.1278 },
      { country: 'Canada', region: 'Ontario', city: 'Toronto', totalSales: 540, totalRevenue: 142000, avgOrderValue: 263, customerCount: 350, lat: 43.6532, lng: -79.3832 },
      { country: 'Australia', region: 'New South Wales', city: 'Sydney', totalSales: 420, totalRevenue: 118000, avgOrderValue: 281, customerCount: 280, lat: -33.8688, lng: 151.2093 },
      { country: 'Germany', region: 'Bavaria', city: 'Munich', totalSales: 380, totalRevenue: 108000, avgOrderValue: 284, customerCount: 250, lat: 48.1351, lng: 11.582 },
      { country: 'France', region: 'Ile-de-France', city: 'Paris', totalSales: 350, totalRevenue: 98000, avgOrderValue: 280, customerCount: 230, lat: 48.8566, lng: 2.3522 },
      { country: 'Japan', region: 'Tokyo', city: 'Tokyo', totalSales: 510, totalRevenue: 156000, avgOrderValue: 306, customerCount: 340, lat: 35.6762, lng: 139.6503 },
      { country: 'Brazil', region: 'Sao Paulo', city: 'Sao Paulo', totalSales: 290, totalRevenue: 62000, avgOrderValue: 214, customerCount: 195, lat: -23.5505, lng: -46.6333 },
      { country: 'India', region: 'Maharashtra', city: 'Mumbai', totalSales: 620, totalRevenue: 89000, avgOrderValue: 143, customerCount: 410, lat: 19.076, lng: 72.8777 },
      { country: 'Mexico', region: 'CDMX', city: 'Mexico City', totalSales: 240, totalRevenue: 48000, avgOrderValue: 200, customerCount: 160, lat: 19.4326, lng: -99.1332 },
    ];

    return geoData.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // ─── 8. Seasonal Trends ─────────────────────────────────────────

  async getSeasonalTrends(): Promise<SeasonalTrend[]> {
    const trends: SeasonalTrend[] = [
      { month: 1, monthName: 'January', year: 2024, totalSales: 2100, totalRevenue: 485000, avgOrderValue: 231, uniqueCustomers: 1200, growthRate: -5.2 },
      { month: 2, monthName: 'February', year: 2024, totalSales: 1950, totalRevenue: 462000, avgOrderValue: 237, uniqueCustomers: 1150, growthRate: -4.7 },
      { month: 3, monthName: 'March', year: 2024, totalSales: 2350, totalRevenue: 568000, avgOrderValue: 242, uniqueCustomers: 1380, growthRate: 23.0 },
      { month: 4, monthName: 'April', year: 2024, totalSales: 2180, totalRevenue: 542000, avgOrderValue: 249, uniqueCustomers: 1280, growthRate: -4.6 },
      { month: 5, monthName: 'May', year: 2024, totalSales: 2520, totalRevenue: 645000, avgOrderValue: 256, uniqueCustomers: 1480, growthRate: 19.0 },
      { month: 6, monthName: 'June', year: 2024, totalSales: 2680, totalRevenue: 712000, avgOrderValue: 266, uniqueCustomers: 1580, growthRate: 10.4 },
      { month: 7, monthName: 'July', year: 2024, totalSales: 2450, totalRevenue: 628000, avgOrderValue: 256, uniqueCustomers: 1420, growthRate: -11.8 },
      { month: 8, monthName: 'August', year: 2024, totalSales: 2320, totalRevenue: 598000, avgOrderValue: 258, uniqueCustomers: 1350, growthRate: -4.8 },
      { month: 9, monthName: 'September', year: 2024, totalSales: 2580, totalRevenue: 682000, avgOrderValue: 264, uniqueCustomers: 1520, growthRate: 14.0 },
      { month: 10, monthName: 'October', year: 2024, totalSales: 2850, totalRevenue: 785000, avgOrderValue: 275, uniqueCustomers: 1680, growthRate: 15.1 },
      { month: 11, monthName: 'November', year: 2024, totalSales: 3420, totalRevenue: 982000, avgOrderValue: 287, uniqueCustomers: 2100, growthRate: 25.1 },
      { month: 12, monthName: 'December', year: 2024, totalSales: 3850, totalRevenue: 1152000, avgOrderValue: 299, uniqueCustomers: 2350, growthRate: 17.3 },
    ];

    return trends;
  }

  // ─── 9. Real-time Stats ─────────────────────────────────────────

  async getRealTimeStats(): Promise<RealTimeStat[]> {
    const now = new Date();

    return [
      { metric: 'active_users', value: 342, change: 12.5, changeType: 'up', timestamp: now },
      { metric: 'page_views', value: 2850, change: 8.3, changeType: 'up', timestamp: now },
      { metric: 'conversion_rate', value: 3.24, change: -0.15, changeType: 'down', timestamp: now },
      { metric: 'avg_session_duration', value: 245, change: 5.2, changeType: 'up', timestamp: now },
      { metric: 'bounce_rate', value: 42.8, change: -2.1, changeType: 'up', timestamp: now },
      { metric: 'revenue_per_minute', value: 158.5, change: 18.7, changeType: 'up', timestamp: now },
      { metric: 'cart_abandonment', value: 68.2, change: 3.4, changeType: 'down', timestamp: now },
      { metric: 'new_signups', value: 24, change: 4, changeType: 'up', timestamp: now },
    ];
  }

  // ─── 10. Export Report ──────────────────────────────────────────

  async exportReport(
    type: 'csv' | 'pdf',
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ filename: string; content: string }> {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = endDate || now;

    if (type === 'csv') {
      // Generate CSV content
      const headers = [
        'Date',
        'Orders',
        'Revenue',
        'Customers',
        'Avg Order Value',
        'Commission',
      ];

      const rows: string[] = [headers.join(',')];

      // Generate sample data rows
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const baseOrders = 50 + Math.floor(Math.random() * 100);
        const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1;
        const orders = Math.floor(baseOrders * weekendMultiplier);
        const revenue = orders * (50 + Math.floor(Math.random() * 200));
        const customers = Math.floor(orders * (0.6 + Math.random() * 0.3));
        const aov = revenue / orders;
        const commission = revenue * 0.1;

        rows.push(
          [
            currentDate.toISOString().split('T')[0],
            orders,
            revenue.toFixed(2),
            customers,
            aov.toFixed(2),
            commission.toFixed(2),
          ].join(','),
        );

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        filename: `bhd-report-${period}-${start.toISOString().split('T')[0]}.csv`,
        content: rows.join('\n'),
      };
    }

    // PDF placeholder - would use a PDF library in production
    return {
      filename: `bhd-report-${period}-${start.toISOString().split('T')[0]}.pdf`,
      content: 'PDF generation not implemented in this version',
    };
  }

  // ─── Dashboard Summary ─────────────────────────────────────────

  async getDashboardSummary(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    topProducts: { name: string; sales: number; revenue: number }[];
    recentActivity: { type: string; description: string; timestamp: Date }[];
  }> {
    return {
      totalRevenue: 2845000,
      totalOrders: 12580,
      totalCustomers: 8450,
      avgOrderValue: 226.15,
      topProducts: [
        { name: 'Wireless Headphones Pro', sales: 1240, revenue: 186000 },
        { name: 'Smart Watch Series 5', sales: 980, revenue: 245000 },
        { name: 'Organic Coffee Beans', sales: 2120, revenue: 84800 },
        { name: 'Yoga Mat Premium', sales: 860, revenue: 43000 },
        { name: 'USB-C Hub', sales: 1540, revenue: 77000 },
      ],
      recentActivity: [
        { type: 'order', description: 'New order #ORD-12452 for $328.50', timestamp: new Date() },
        { type: 'customer', description: 'New customer registration: john@example.com', timestamp: new Date(Date.now() - 120000) },
        { type: 'commission', description: 'Commission paid: $45.20 to affiliate AFF-001', timestamp: new Date(Date.now() - 300000) },
        { type: 'alert', description: 'Low stock alert: Wireless Headphones Pro (12 left)', timestamp: new Date(Date.now() - 600000) },
        { type: 'order', description: 'Order #ORD-12451 completed', timestamp: new Date(Date.now() - 900000) },
      ],
    };
  }
}
