'use client';

import React from 'react';
import {
  Mail,
  Phone,
  Building2,
  Tag,
  Calendar,
  Clock,
  User,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  status: string;
  source: string;
  tags: string[];
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  estimatedValue: number | null;
  notes: string | null;
  assignedTo: string | null;
  createdAt: string;
  interactionsCount?: number;
}

interface ContactCardProps {
  contact: Contact;
  onClick?: (contact: Contact) => void;
  compact?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  new: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'New' },
  contacted: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Contacted' },
  qualified: { color: 'text-green-700', bg: 'bg-green-100', label: 'Qualified' },
  proposal: { color: 'text-purple-700', bg: 'bg-purple-100', label: 'Proposal' },
  negotiation: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Negotiation' },
  won: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Won' },
  lost: { color: 'text-red-700', bg: 'bg-red-100', label: 'Lost' },
};

const sourceIcons: Record<string, string> = {
  website: '🌐',
  referral: '👥',
  social_media: '📱',
  b2b_portal: '🏢',
  whatsapp: '💬',
  other: '📋',
};

export function ContactCard({ contact, onClick, compact = false }: ContactCardProps) {
  const status = statusConfig[contact.status] || statusConfig.new;

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (compact) {
    return (
      <div
        onClick={() => onClick?.(contact)}
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-blue-700">
            {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.bg} ${status.color} flex-shrink-0`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(contact)}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">
              {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {contact.name}
            </h3>
            {contact.company && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="w-3 h-3" />
                {contact.company}
              </div>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          {contact.email}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          {contact.phone}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-base">{sourceIcons[contact.source] || '📋'}</span>
          <span className="capitalize">{contact.source.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Value & Dates */}
      {(contact.estimatedValue || contact.nextFollowUpDate) && (
        <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
          {contact.estimatedValue && (
            <div>
              <p className="text-xs text-gray-500">Est. Value</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(contact.estimatedValue)}
              </p>
            </div>
          )}
          {contact.nextFollowUpDate && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Follow-up</p>
              <p className="text-sm font-medium text-orange-600">
                {formatDate(contact.nextFollowUpDate)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(contact.lastContactDate)}
          </span>
          {contact.interactionsCount !== undefined && contact.interactionsCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {contact.interactionsCount}
            </span>
          )}
        </div>
        {contact.assignedTo && (
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="w-3 h-3 text-indigo-600" />
          </div>
        )}
      </div>
    </div>
  );
}
