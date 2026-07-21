'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MessageCircle,
  MessageSquare,
  FileText,
  CheckSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  User,
} from 'lucide-react';

interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'note' | 'task';
  direction: 'inbound' | 'outbound';
  subject: string;
  content: string;
  scheduledAt: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
}

interface InteractionTimelineProps {
  interactions: Interaction[];
  onAddInteraction?: () => void;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  call: { icon: Phone, color: 'text-green-600', bg: 'bg-green-100', label: 'Call' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Email' },
  meeting: { icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Meeting' },
  whatsapp: { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'WhatsApp' },
  note: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Note' },
  task: { icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Task' },
};

export function InteractionTimeline({ interactions, onAddInteraction }: InteractionTimelineProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group by date
  const grouped = interactions.reduce<Record<string, Interaction[]>>((acc, interaction) => {
    const date = new Date(interaction.createdAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(interaction);
    return acc;
  }, {});

  if (interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Clock className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No interactions yet</h3>
        <p className="text-xs text-gray-500 mb-4">Start tracking your communication history</p>
        {onAddInteraction && (
          <button
            onClick={onAddInteraction}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Interaction
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([date, dateInteractions]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                {formatDate(date)}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Timeline Items */}
            <div className="space-y-3">
              {dateInteractions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((interaction, index) => {
                  const config = typeConfig[interaction.type] || typeConfig.note;
                  const Icon = config.icon;
                  const isInbound = interaction.direction === 'inbound';

                  return (
                    <div
                      key={interaction.id}
                      className="flex gap-3 group"
                    >
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        {index < dateInteractions.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 my-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                {isInbound ? (
                                  <ArrowDownLeft className="w-3 h-3 text-green-500" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3 text-blue-500" />
                                )}
                                {isInbound ? 'Inbound' : 'Outbound'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">{formatTime(interaction.createdAt)}</span>
                          </div>

                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {interaction.subject}
                          </h4>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {interaction.content}
                          </p>

                          {interaction.scheduledAt && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                              <Clock className="w-3 h-3" />
                              Scheduled: {formatDate(interaction.scheduledAt)} at {formatTime(interaction.scheduledAt)}
                            </div>
                          )}

                          {interaction.completedAt && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                              <CheckSquare className="w-3 h-3" />
                              Completed: {formatDate(interaction.completedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
    </div>
  );
}
