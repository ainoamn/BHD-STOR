'use client';

import React, { useState, useCallback } from 'react';
import {
  TreePine,
  Users,
  DollarSign,
  ChevronDown,
  ChevronRight,
  User,
  Network,
  Search,
  Layers,
} from 'lucide-react';

interface MLMNode {
  userId: string;
  referrerId: string | null;
  level: number;
  children: MLMNode[];
  earnings?: number;
  name?: string;
}

interface MLMData {
  node: MLMNode;
  totalEarnings: number;
  networkSize: number;
}

interface TreeNodeProps {
  node: MLMNode;
  depth: number;
  isLast: boolean;
  parentExpanded: boolean;
}

const levelColors: Record<number, string> = {
  0: 'bg-blue-500',
  1: 'bg-emerald-500',
  2: 'bg-purple-500',
  3: 'bg-orange-500',
  4: 'bg-pink-500',
  5: 'bg-indigo-500',
};

const levelBgColors: Record<number, string> = {
  0: 'bg-blue-50 border-blue-200',
  1: 'bg-emerald-50 border-emerald-200',
  2: 'bg-purple-50 border-purple-200',
  3: 'bg-orange-50 border-orange-200',
  4: 'bg-pink-50 border-pink-200',
  5: 'bg-indigo-50 border-indigo-200',
};

function TreeNode({ node, depth, isLast }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const colorClass = levelColors[depth] || levelColors[5];
  const bgClass = levelBgColors[depth] || levelBgColors[5];

  return (
    <div className="select-none">
      <div className="flex items-start">
        {/* Connector lines */}
        <div className="flex flex-col items-center mr-2">
          <div className="flex items-center h-8">
            {depth > 0 && (
              <div className="w-4 border-b-2 border-gray-200" />
            )}
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  expanded
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className={`w-2.5 h-2.5 rounded-full ${colorClass} ml-1`} />
            )}
          </div>
          {/* Vertical line for children */}
          {hasChildren && expanded && (
            <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />
          )}
        </div>

        {/* Node Card */}
        <div className={`flex-1 mb-2 p-3 rounded-lg border ${bgClass} hover:shadow-sm transition-shadow`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {node.name || `User ${node.userId.slice(0, 8)}...`}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Level {node.level}</span>
                  {node.referrerId && (
                    <>
                      <span>·</span>
                      <span>Referred by {node.referrerId.slice(0, 8)}...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {node.earnings !== undefined && (
                <p className="text-sm font-semibold text-gray-900">
                  ${node.earnings.toLocaleString()}
                </p>
              )}
              {hasChildren && (
                <p className="text-xs text-gray-500">{node.children.length} downline</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-4">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.userId}
              node={child}
              depth={depth + 1}
              isLast={index === node.children.length - 1}
              parentExpanded={expanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MLMTree() {
  const [userId, setUserId] = useState('');
  const [mlmData, setMlmData] = useState<MLMData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDownline = useCallback(async () => {
    if (!userId.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/commissions/mlm/downline/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMlmData(data.data);
      }
    } catch (error) {
      console.error('Error fetching MLM downline:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Demo data for initial view
  const loadDemo = () => {
    const demoData: MLMData = {
      node: {
        userId: 'root-user-001',
        name: 'John Smith',
        referrerId: null,
        level: 0,
        earnings: 12500,
        children: [
          {
            userId: 'dl-1-001',
            name: 'Alice Johnson',
            referrerId: 'root-user-001',
            level: 1,
            earnings: 8400,
            children: [
              {
                userId: 'dl-1-1-001',
                name: 'Bob Wilson',
                referrerId: 'dl-1-001',
                level: 2,
                earnings: 3200,
                children: [],
              },
              {
                userId: 'dl-1-1-002',
                name: 'Carol Davis',
                referrerId: 'dl-1-001',
                level: 2,
                earnings: 2800,
                children: [],
              },
            ],
          },
          {
            userId: 'dl-1-002',
            name: 'David Brown',
            referrerId: 'root-user-001',
            level: 1,
            earnings: 6200,
            children: [
              {
                userId: 'dl-2-1-001',
                name: 'Eva Martinez',
                referrerId: 'dl-1-002',
                level: 2,
                earnings: 1900,
                children: [
                  {
                    userId: 'dl-3-1-001',
                    name: 'Frank Lee',
                    referrerId: 'dl-2-1-001',
                    level: 3,
                    earnings: 800,
                    children: [],
                  },
                ],
              },
              {
                userId: 'dl-2-1-002',
                name: 'Grace Kim',
                referrerId: 'dl-1-002',
                level: 2,
                earnings: 1500,
                children: [],
              },
            ],
          },
          {
            userId: 'dl-1-003',
            name: 'Henry Taylor',
            referrerId: 'root-user-001',
            level: 1,
            earnings: 4500,
            children: [],
          },
        ],
      },
      totalEarnings: 40800,
      networkSize: 8,
    };
    setMlmData(demoData);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
        <Network className="w-5 h-5 text-gray-400" />
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Enter User ID to view their MLM network
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDownline()}
              placeholder="User UUID..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchDownline}
              disabled={loading || !userId.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              View Network
            </button>
            <button
              onClick={loadDemo}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Demo
            </button>
          </div>
        </div>
      </div>

      {/* MLM Stats */}
      {mlmData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Network Size</p>
                <p className="text-xl font-bold text-gray-900">{mlmData.networkSize} members</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-xl font-bold text-gray-900">
                  ${mlmData.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Depth</p>
                <p className="text-xl font-bold text-gray-900">
                  {getTreeDepth(mlmData.node)} levels
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tree */}
      {mlmData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TreePine className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Network Hierarchy</h3>
          </div>
          <TreeNode
            node={mlmData.node}
            depth={0}
            isLast={true}
            parentExpanded={true}
          />
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
        <span className="text-xs font-medium text-gray-500">Level Legend:</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${levelColors[level]}`} />
            <span className="text-xs text-gray-600">Level {level}</span>
          </div>
        ))}
      </div>

      {!mlmData && !loading && (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <TreePine className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">MLM Network Viewer</h3>
          <p className="text-gray-500 text-sm text-center max-w-sm mb-4">
            Enter a user ID to visualize their multi-level marketing network structure
          </p>
          <button
            onClick={loadDemo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load Demo Data
          </button>
        </div>
      )}
    </div>
  );
}

function getTreeDepth(node: MLMNode): number {
  if (node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(getTreeDepth));
}
