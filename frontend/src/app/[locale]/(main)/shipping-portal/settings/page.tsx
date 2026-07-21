'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useB2bAuth, useB2bSettings } from '../../../../../hooks/useB2b';
import { getApiKey, setApiKey, configureWebhook } from '../../../../../services/b2b.service';

export default function B2bSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout } = useB2bAuth();
  const { settings, loading, saving, saveError, updateSettings } = useB2bSettings();

  // Local form state
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    'shipment.created',
    'shipment.updated',
    'shipment.delivered',
  ]);
  const [emailOnDelivery, setEmailOnDelivery] = useState(true);
  const [emailOnException, setEmailOnException] = useState(true);
  const [smsOnDelivery, setSmsOnDelivery] = useState(false);
  const [webhookOnStatusChange, setWebhookOnStatusChange] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [webhookSaved, setWebhookSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/en/shipping-portal');
    }
  }, [isAuthenticated, authLoading, router]);

  // Sync settings to local state
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName);
      setContactEmail(settings.contactEmail);
      setContactPhone(settings.contactPhone);
      setAddress(settings.address);
      setWebhookUrl(settings.webhookUrl || '');
      setEmailOnDelivery(settings.notificationPreferences.emailOnDelivery);
      setEmailOnException(settings.notificationPreferences.emailOnException);
      setSmsOnDelivery(settings.notificationPreferences.smsOnDelivery);
      setWebhookOnStatusChange(settings.notificationPreferences.webhookOnStatusChange);
    }
  }, [settings]);

  useEffect(() => {
    const key = getApiKey();
    if (key) setApiKeyValue(key);
  }, []);

  const handleSaveCompany = async () => {
    await updateSettings({
      companyName,
      contactEmail,
      contactPhone,
      address,
    });
  };

  const handleSaveNotifications = async () => {
    await updateSettings({
      notificationPreferences: {
        emailOnDelivery,
        emailOnException,
        smsOnDelivery,
        webhookOnStatusChange,
      },
    });
  };

  const handleSaveWebhook = async () => {
    try {
      await configureWebhook(webhookUrl, webhookEvents);
      setWebhookSaved(true);
      setTimeout(() => setWebhookSaved(false), 3000);
      await updateSettings({ webhookUrl });
    } catch {
      // Error handled by hook
    }
  };

  const handleRegenerateApiKey = () => {
    if (
      confirm(
        'Are you sure you want to regenerate your API key? The old key will stop working immediately.',
      )
    ) {
      const newKey = 'bhd_' + Array.from({ length: 32 }, () =>
        Math.random().toString(36).charAt(2),
      ).join('');
      setApiKey(newKey);
      setApiKeyValue(newKey);
    }
  };

  const availableWebhookEvents = [
    { value: 'shipment.created', label: 'Shipment Created' },
    { value: 'shipment.updated', label: 'Shipment Updated' },
    { value: 'shipment.delivered', label: 'Shipment Delivered' },
    { value: 'shipment.failed', label: 'Delivery Failed' },
    { value: 'shipment.cancelled', label: 'Shipment Cancelled' },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/en/shipping-portal/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </button>
              <span className="text-gray-300 mx-3">|</span>
              <h1 className="font-semibold text-gray-800">Settings</h1>
            </div>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-500 mt-1">Manage your company profile, API keys, and preferences</p>
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {saveError}
          </div>
        )}

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Company Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveCompany}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                API Keys
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  API Key
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyValue}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(apiKeyValue)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Use this key in the X-API-Key header for all API requests.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRegenerateApiKey}
                  className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate Key
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Webhook Configuration
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhook/bhd"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  We will POST shipment updates to this URL.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events to Subscribe
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableWebhookEvents.map((event) => (
                    <label
                      key={event.value}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(event.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, event.value]);
                          } else {
                            setWebhookEvents(webhookEvents.filter((ev) => ev !== event.value));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveWebhook}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  Save Webhook
                </button>
                {webhookSaved && (
                  <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved successfully
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notification Preferences
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                {
                  label: 'Email on Delivery',
                  desc: 'Receive an email when a shipment is delivered',
                  checked: emailOnDelivery,
                  onChange: setEmailOnDelivery,
                },
                {
                  label: 'Email on Exception',
                  desc: 'Receive an email when a delivery fails or is delayed',
                  checked: emailOnException,
                  onChange: setEmailOnException,
                },
                {
                  label: 'SMS on Delivery',
                  desc: 'Receive an SMS when a shipment is delivered',
                  checked: smsOnDelivery,
                  onChange: setSmsOnDelivery,
                },
                {
                  label: 'Webhook on Status Change',
                  desc: 'Send webhook notifications on any status change',
                  checked: webhookOnStatusChange,
                  onChange: setWebhookOnStatusChange,
                },
              ].map((pref) => (
                <label
                  key={pref.label}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={pref.checked}
                    onChange={(e) => pref.onChange(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                    <p className="text-xs text-gray-500">{pref.desc}</p>
                  </div>
                </label>
              ))}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Persons */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Contact Persons
              </h3>
            </div>
            <div className="p-6">
              {settings?.contactPersons?.length ? (
                <div className="space-y-3">
                  {settings.contactPersons.map((person, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {person.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {person.email} · {person.phone}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full capitalize">
                        {person.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No contact persons configured.
                </p>
              )}
              <button
                onClick={() => alert('Contact management coming soon')}
                className="w-full mt-4 border border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contact Person
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
