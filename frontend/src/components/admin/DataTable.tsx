'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  Trash2,
  X,
} from 'lucide-react';

const BHD_GREEN = '#006400';
const BHD_GOLD = '#D4AF37';
const BHD_RED = '#C41E3A';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchable?: boolean;
  searchKeys?: string[];
  filters?: FilterOption[];
  selectable?: boolean;
  bulkActions?: { label: string; value: string; variant?: 'danger' }[];
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  rowId: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  searchable = true,
  searchKeys,
  filters = [],
  selectable = true,
  bulkActions = [],
  onBulkAction,
  pagination,
  rowId,
  emptyMessage = 'No data found',
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchable && search && searchKeys) {
      const query = search.toLowerCase();
      result = result.filter((row: any) =>
        searchKeys.some((key) => {
          const value = key.split('.').reduce((obj, k) => obj?.[k], row);
          return String(value || '').toLowerCase().includes(query);
        })
      );
    }

    // Filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row: any) => {
          const rowValue = key.split('.').reduce((obj, k) => obj?.[k], row);
          return String(rowValue) === value;
        });
      }
    });

    // Sort
    if (sortKey) {
      result.sort((a: any, b: any) => {
        const aVal = sortKey.split('.').reduce((obj, k) => obj?.[k], a) ?? '';
        const bVal = sortKey.split('.').reduce((obj, k) => obj?.[k], b) ?? '';
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, searchKeys, activeFilters, sortKey, sortOrder, searchable]);

  // Paginate
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (pagination.page - 1) * pagination.limit;
    return filteredData.slice(start, start + pagination.limit);
  }, [filteredData, pagination]);

  const allSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((row) => selectedIds.has(rowId(row)));
  }, [paginatedData, selectedIds, rowId]);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortOrder('asc');
      }
    },
    [sortKey]
  );

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      const newSet = new Set(selectedIds);
      paginatedData.forEach((row) => newSet.delete(rowId(row)));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      paginatedData.forEach((row) => newSet.add(rowId(row)));
      setSelectedIds(newSet);
    }
  }, [allSelected, paginatedData, selectedIds, rowId]);

  const toggleSelect = useCallback(
    (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectedIds(newSet);
    },
    [selectedIds]
  );

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    pagination?.onPageChange(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearch('');
    pagination?.onPageChange(1);
  };

  const exportToCSV = () => {
    const headers = columns.map((col) => col.header).join(',');
    const rows = filteredData.map((row: any) =>
      columns
        .map((col) => {
          const value = col.key.split('.').reduce((obj, k) => obj?.[k], row);
          return `"${String(value || '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleBulkAction = () => {
    if (bulkAction && onBulkAction && selectedIds.size > 0) {
      onBulkAction(bulkAction, Array.from(selectedIds));
      setBulkAction('');
      setSelectedIds(new Set());
    }
  };

  const totalPages = pagination
    ? Math.ceil((pagination.total || filteredData.length) / pagination.limit)
    : 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
        {searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                pagination?.onPageChange(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
            />
          </div>
        )}

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters || Object.values(activeFilters).some(Boolean)
                ? 'text-white border-transparent'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            style={
              showFilters || Object.values(activeFilters).some(Boolean)
                ? { backgroundColor: BHD_GREEN }
                : undefined
            }
          >
            <Filter size={16} />
            Filters
            {Object.values(activeFilters).some(Boolean) && (
              <span
                className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full text-white"
                style={{ backgroundColor: BHD_GOLD }}
              >
                {Object.values(activeFilters).filter(Boolean).length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Export
        </button>

        {/* Bulk Actions */}
        {selectable && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">
              {selectedIds.size} selected
            </span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
            >
              <option value="">Bulk actions...</option>
              {bulkActions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            {bulkAction && (
              <button
                onClick={handleBulkAction}
                className="px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    bulkActions.find((a) => a.value === bulkAction)?.variant ===
                    'danger'
                      ? BHD_RED
                      : BHD_GREEN,
                }}
              >
                Apply
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && filters.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">
                {filter.label}:
              </label>
              <select
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
              >
                <option value="">All</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {(Object.values(activeFilters).some(Boolean) || search) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
            >
              <X size={14} />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-gray-400">
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-4">
                      <div className="w-4 h-4 bg-gray-200 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const id = rowId(row);
                return (
                  <tr
                    key={id || index}
                    onClick={() => onRowClick?.(row)}
                    className={`hover:bg-gray-50 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${selectedIds.has(id) ? 'bg-green-50/50' : ''}`}
                  >
                    {selectable && (
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => toggleSelect(id)}
                          className="w-4 h-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5">
                        {col.render
                          ? col.render(row)
                          : (col.key.split('.').reduce((obj: any, k) => obj?.[k], row as any) ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Showing</span>
            <select
              value={pagination.limit}
              onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': BHD_GREEN } as React.CSSProperties}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              of {pagination.total || filteredData.length} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === pageNum
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={
                    pagination.page === pageNum
                      ? { backgroundColor: BHD_GREEN }
                      : undefined
                  }
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={pagination.page === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
