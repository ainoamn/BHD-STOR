'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Calendar, User, MoreHorizontal, ChevronRight, ArrowRight } from 'lucide-react';

interface PipelineOpportunity {
  id: string;
  title: string;
  value: number;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  contactId: string;
  contact?: { name: string; email: string };
  stage: string;
}

interface PipelineData {
  [stage: string]: PipelineOpportunity[];
}

const stages = [
  { key: 'prospecting', label: 'Prospecting', color: 'bg-gray-100', headerColor: 'bg-gray-200', textColor: 'text-gray-700', borderColor: 'border-gray-300' },
  { key: 'qualification', label: 'Qualification', color: 'bg-blue-50', headerColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-50', headerColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-50', headerColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  { key: 'closed_won', label: 'Won', color: 'bg-emerald-50', headerColor: 'bg-emerald-100', textColor: 'text-emerald-700', borderColor: 'border-emerald-300' },
  { key: 'closed_lost', label: 'Lost', color: 'bg-red-50', headerColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' },
];

export function PipelineBoard() {
  const [pipeline, setPipeline] = useState<PipelineData>({});
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/pipeline');
      if (res.ok) {
        const data = await res.json();
        setPipeline(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const handleDragStart = (oppId: string) => {
    setDraggingId(oppId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggingId) return;

    try {
      const res = await fetch(`/api/crm/opportunities/${draggingId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageKey }),
      });

      if (res.ok) {
        fetchPipeline();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
    }

    setDraggingId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStageValue = (stageKey: string) => {
    return (pipeline[stageKey] || []).reduce((sum, o) => sum + Number(o.value), 0);
  };

  const getStageCount = (stageKey: string) => {
    return (pipeline[stageKey] || []).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasOpportunities = stages.some((s) => getStageCount(s.key) > 0);

  if (!hasOpportunities) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ArrowRight className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
        <p className="text-gray-500 text-center max-w-sm">
          Create your first opportunity to start tracking your sales pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Summary Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${stage.color} border ${stage.borderColor} flex-shrink-0`}>
              <span className={`text-xs font-semibold ${stage.textColor}`}>
                {getStageCount(stage.key)}
              </span>
              <span className="text-xs text-gray-600">{stage.label}</span>
              <span className={`text-xs font-medium ${stage.textColor}`}>
                {formatCurrency(getStageValue(stage.key))}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const opps = pipeline[stage.key] || [];
          const isDragOver = dragOverStage === stage.key;

          return (
            <div
              key={stage.key}
              className={`rounded-xl border-2 transition-colors ${
                isDragOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
              }`}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              {/* Stage Header */}
              <div className={`${stage.headerColor} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${stage.textColor}`}>{stage.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/60 ${stage.textColor}`}>
                    {opps.length}
                  </span>
                </div>
                <span className={`text-xs font-medium ${stage.textColor}`}>
                  {formatCurrency(getStageValue(stage.key))}
                </span>
              </div>

              {/* Stage Cards */}
              <div className="p-3 space-y-3 min-h-[200px]">
                {opps.map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={() => handleDragStart(opp.id)}
                    className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                      draggingId === opp.id ? 'opacity-50' : ''
                    }`}
                  >
                    <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {opp.title}
                    </h4>

                    {opp.contact && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{opp.contact.name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(opp.value))}
                      </span>
                      <span className="text-xs text-gray-500">{opp.probability}%</span>
                    </div>

                    {/* Probability bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${opp.probability}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(opp.expectedCloseDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 rounded-full bg-blue-100 border border-white flex items-center justify-center">
                          <span className="text-[8px] text-blue-600 font-medium">
                            {opp.assignedTo?.slice(0, 2).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {opps.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
