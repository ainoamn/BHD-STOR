'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  Crown,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={20} /> },
  { label: 'Stores', href: '/dashboard/admin/stores', icon: <Store size={20} /> },
  { label: 'Products', href: '/dashboard/admin/products', icon: <Package size={20} /> },
  { label: 'Orders', href: '/dashboard/admin/orders', icon: <ShoppingCart size={20} /> },
  { label: 'Payments', href: '/dashboard/admin/payments', icon: <CreditCard size={20} /> },
  { label: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: <Crown size={20} /> },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Settings', href: '/dashboard/admin/settings', icon: <Settings size={20} /> },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === href;
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '260px',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between h-16 px-4 border-b border-gray-200"
        style={{ backgroundColor: BHD_GREEN }}
      >
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-3 overflow-hidden"
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ backgroundColor: BHD_GOLD }}
          >
            <Shield size={18} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-white whitespace-nowrap">
              BHD Admin
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={16} className="text-white" />
          ) : (
            <ChevronLeft size={16} className="text-white" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  style={
                    active
                      ? { backgroundColor: BHD_GREEN }
                      : undefined
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-xs text-gray-400 text-center">
            BHD Marketplace v2.0
          </div>
        </div>
      )}
    </aside>
  );
}
