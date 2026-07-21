'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Users,
  TrendingUp,
  DollarSign,
  PhoneCall,
  Mail,
  Calendar,
  ChevronRight,
  Filter,
  Search,
  Plus,
  BarChart3,
  Target,
  UserCheck,
  Clock,
} from 'lucide-react';
import { ContactCard } from '@/components/crm/ContactCard';
import { SalesForecast } from '@/components/crm/SalesForecast';
import { PipelineBoard } from '@/components/crm/PipelineBoard';

interface DashboardStats {
  totalContacts: number;
  newContactsThisMonth: number;
  totalOpportunities: number;
  totalPipelineValue: number;
  wonRevenueThisMonth: number;
  conversionRate: number;
  upcomingFollowUps: number;
  recentInteractions: number;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  status: string;
  source: string;
  assignedTo: string | null;
  tags: string[];
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  estimatedValue: number | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  proposal: 'bg-purple-100 text-purple-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
};

export default function CrmDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await fetch('/api/crm/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      } else {
        setStats({
          totalContacts: 156,
          newContactsThisMonth: 23,
          totalOpportunities: 42,
          totalPipelineValue: 125000,
          wonRevenueThisMonth: 45000,
          conversionRate: 28.5,
          upcomingFollowUps: 8,
          recentInteractions: 34,
        });
      }

      const contactsRes = await fetch('/api/crm/contacts?limit=5&sortBy=createdAt&sortOrder=DESC');
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setRecentContacts(contactsData.data || []);
      } else {
        setRecentContacts([
          {
            id: '1',
            name: 'أحمد المعمري',
            email: 'ahmed@example.om',
            phone: '+96891234567',
            company: 'شركة النور',
            status: 'qualified',
            source: 'website',
            assignedTo: 'مدير المبيعات',
            tags: ['VIP'],
            lastContactDate: '2026-07-07T00:00:00Z',
            nextFollowUpDate: '2026-07-10T00:00:00Z',
            estimatedValue: 5000,
            createdAt: '2026-06-15T00:00:00Z',
          },
          {
            id: '2',
            name: 'فاطمة الحارثية',
            email: 'fatima@example.om',
            phone: '+96898765432',
            company: null,
            status: 'new',
            source: 'referral',
            assignedTo: null,
            tags: [],
            lastContactDate: null,
            nextFollowUpDate: '2026-07-09T00:00:00Z',
            estimatedValue: 2500,
            createdAt: '2026-07-05T00:00:00Z',
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching CRM dashboard:', error);
      setStats({
        totalContacts: 156,
        newContactsThisMonth: 23,
        totalOpportunities: 42,
        totalPipelineValue: 125000,
        wonRevenueThisMonth: 45000,
        conversionRate: 28.5,
        upcomingFollowUps: 8,
        recentInteractions: 34,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      label: 'Total Contacts',
      value: stats?.totalContacts ?? 0,
      change: `+${stats?.newContactsThisMonth ?? 0} this month`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(stats?.totalPipelineValue ?? 0),
      change: `${stats?.totalOpportunities ?? 0} opportunities`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Revenue Won',
      value: formatCurrency(stats?.wonRevenueThisMonth ?? 0),
      change: 'This month',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Conversion Rate',
      value: `${(stats?.conversionRate ?? 0).toFixed(1)}%`,
      change: 'Won / Total closed',
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Follow-ups',
      value: stats?.upcomingFollowUps ?? 0,
      change: 'Next 7 days',
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Interactions',
      value: stats?.recentInteractions ?? 0,
      change: 'This month',
      icon: PhoneCall,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage contacts, opportunities, and sales pipeline</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/${locale}/dashboard/admin/crm/contacts`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Users className="w-4 h-4" />
            All Contacts
          </button>
          <button
            onClick={() => router.push(`/${locale}/dashboard/admin/crm/opportunities`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Target className="w-4 h-4" />
            Pipeline
          </button>
          <button
            onClick={() => router.push(`/${locale}/dashboard/admin/crm/contacts?action=new`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </span>
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'pipeline'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Pipeline Board
          </span>
          {activeTab === 'pipeline' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Forecast */}
          <div className="lg:col-span-2">
            <SalesForecast />
          </div>

          {/* Recent Contacts */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Recent Contacts
              </h3>
              <button
                onClick={() => router.push(`/${locale}/dashboard/admin/crm/contacts`)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentContacts.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No contacts yet. Add your first contact to get started.
                </div>
              )}
              {recentContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    router.push(`/${locale}/dashboard/admin/crm/contacts?id=${contact.id}`)
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{contact.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColors[contact.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contact.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </span>
                    {contact.estimatedValue && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(contact.estimatedValue)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <PipelineBoard />
      )}
    </div>
  );
}
