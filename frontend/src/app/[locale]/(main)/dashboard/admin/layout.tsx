'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Bell, Search, Menu, User, LogOut } from 'lucide-react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';
const BHD_RED = '#C41E3A';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-50">
          <div className="h-full bg-white w-72 shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b" style={{ backgroundColor: BHD_GREEN }}>
              <span className="font-bold text-lg text-white">BHD Admin</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-1"
              >
                <Menu size={20} />
              </button>
            </div>
            <nav className="p-4">
              {[
                { label: 'Dashboard', href: '/dashboard/admin' },
                { label: 'Users', href: '/dashboard/admin/users' },
                { label: 'Stores', href: '/dashboard/admin/stores' },
                { label: 'Products', href: '/dashboard/admin/products' },
                { label: 'Orders', href: '/dashboard/admin/orders' },
                { label: 'Payments', href: '/dashboard/admin/payments' },
                { label: 'Subscriptions', href: '/dashboard/admin/subscriptions' },
                { label: 'Analytics', href: '/dashboard/admin/analytics' },
                { label: 'Settings', href: '/dashboard/admin/settings' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header
        className="fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 lg:px-6 transition-all duration-300"
        style={{ left: sidebarWidth }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search anything..."
                  className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                  onBlur={() => setSearchOpen(false)}
                />
                <Search
                  size={16}
                  className="absolute left-3 text-gray-400"
                />
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Search size={16} />
                <span>Search...</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 rounded">
                  /
                </kbd>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} />
              <span
                className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                style={{ backgroundColor: BHD_RED }}
              >
                3
              </span>
            </button>
            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-900">
                      Notifications
                    </h4>
                    <button
                      className="text-xs font-medium hover:underline"
                      style={{ color: BHD_GREEN }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {[
                      {
                        title: 'New store verification request',
                        desc: 'Oman Crafts LLC submitted documents',
                        time: '2 min ago',
                      },
                      {
                        title: 'Order dispute filed',
                        desc: 'Order #ORD-4521 needs attention',
                        time: '15 min ago',
                      },
                      {
                        title: 'New user registration spike',
                        desc: '45 new users in the last hour',
                        time: '1 hour ago',
                      },
                    ].map((notif, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {notif.desc}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: BHD_GREEN }}
              >
                <User size={16} />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  Admin User
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  Super Admin
                </p>
              </div>
            </button>
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      Admin User
                    </p>
                    <p className="text-xs text-gray-500">
                      admin@bhd-oman.com
                    </p>
                  </div>
                  <div className="py-1">
                    <a
                      href="/dashboard/admin/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={16} />
                      Profile
                    </a>
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="pt-16 px-4 lg:px-6 py-6 transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
}
