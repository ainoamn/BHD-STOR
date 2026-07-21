'use client';

import React, { useState } from 'react';
import {
  Save,
  Globe,
  CreditCard,
  Truck,
  Mail,
  Share2,
  AlertTriangle,
} from 'lucide-react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';
const BHD_RED = '#C41E3A';

const tabs = [
  { key: 'general', label: 'General', icon: <Globe size={18} /> },
  { key: 'payment', label: 'Payment', icon: <CreditCard size={18} /> },
  { key: 'shipping', label: 'Shipping', icon: <Truck size={18} /> },
  { key: 'email', label: 'Email Templates', icon: <Mail size={18} /> },
  { key: 'social', label: 'Social Links', icon: <Share2 size={18} /> },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your marketplace settings
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: BHD_GREEN }}
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>

      {saved && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#f0fdf4', color: BHD_GREEN }}
        >
          <AlertTriangle size={16} />
          Settings saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={
              activeTab === tab.key
                ? { color: BHD_GREEN, borderColor: BHD_GREEN }
                : undefined
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            General Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="BHD Oman Marketplace"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="support@bhd-oman.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                defaultValue="+968 2456 7890"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Currency
              </label>
              <select
                defaultValue="OMR"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              >
                <option value="OMR">Omani Rial (OMR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="AED">UAE Dirham (AED)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Language
              </label>
              <select
                defaultValue="en"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                defaultValue="Asia/Muscat"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              >
                <option value="Asia/Muscat">Muscat (GMT+4)</option>
                <option value="Asia/Dubai">Dubai (GMT+4)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform Logo URL
            </label>
            <input
              type="url"
              defaultValue="https://cdn.bhd-oman.com/logo.png"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              defaultValue="BHD Oman - Your premier Omani e-commerce marketplace connecting local sellers with buyers across the Sultanate."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="5.0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Payout Amount (OMR)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="50.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Gateway
              </label>
              <select
                defaultValue="thawani"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              >
                <option value="thawani">Thawani Pay</option>
                <option value="oman_pay">Oman Pay</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payout Schedule
              </label>
              <select
                defaultValue="biweekly"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {[
              {
                key: 'cod',
                label: 'Enable Cash on Delivery',
                defaultChecked: true,
              },
              {
                key: 'cards',
                label: 'Enable Credit/Debit Cards',
                defaultChecked: true,
              },
              {
                key: 'bank',
                label: 'Enable Bank Transfer',
                defaultChecked: true,
              },
              {
                key: 'wallet',
                label: 'Enable Digital Wallet',
                defaultChecked: false,
              },
            ].map((opt) => (
              <div key={opt.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={opt.key}
                  defaultChecked={opt.defaultChecked}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor={opt.key} className="text-sm text-gray-700">
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Settings */}
      {activeTab === 'shipping' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Shipping Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Standard Shipping Cost (OMR)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="2.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Express Shipping Cost (OMR)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="5.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Free Shipping Threshold (OMR)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="50.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Time (Standard)
              </label>
              <input
                type="text"
                defaultValue="3-5 business days"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: 'free_ship', label: 'Enable Free Shipping', defaultChecked: true },
              { key: 'express', label: 'Enable Express Shipping', defaultChecked: true },
              { key: 'pickup', label: 'Enable Store Pickup', defaultChecked: false },
            ].map((opt) => (
              <div key={opt.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={opt.key}
                  defaultChecked={opt.defaultChecked}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor={opt.key} className="text-sm text-gray-700">
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Templates */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Email Templates
          </h3>
          {[
            {
              key: 'welcome',
              label: 'Welcome Email',
              subject: 'Welcome to BHD Oman Marketplace!',
            },
            {
              key: 'order',
              label: 'Order Confirmation',
              subject: 'Your order has been confirmed',
            },
            {
              key: 'shipping',
              label: 'Shipping Notification',
              subject: 'Your order has been shipped',
            },
            {
              key: 'verify',
              label: 'Store Verification',
              subject: 'Your store has been verified',
            },
          ].map((template) => (
            <div
              key={template.key}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{template.label}</h4>
                <button
                  className="text-xs font-medium hover:underline"
                  style={{ color: BHD_GREEN }}
                >
                  Edit Template
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  defaultValue={template.subject}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={
                    { '--tw-ring-color': BHD_GREEN } as React.CSSProperties
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`${template.key}_enabled`}
                  defaultChecked
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label
                  htmlFor={`${template.key}_enabled`}
                  className="text-sm text-gray-700"
                >
                  Enable this email
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Social Links */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="url"
                defaultValue="https://instagram.com/bhdoman"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter / X
              </label>
              <input
                type="url"
                defaultValue="https://twitter.com/bhdoman"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="url"
                defaultValue="https://facebook.com/bhdoman"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                type="url"
                defaultValue="https://linkedin.com/company/bhdoman"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                placeholder="https://linkedin.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube
              </label>
              <input
                type="url"
                defaultValue="https://youtube.com/@bhdoman"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Business
              </label>
              <input
                type="url"
                defaultValue="https://wa.me/96824567890"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
                placeholder="https://wa.me/..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
