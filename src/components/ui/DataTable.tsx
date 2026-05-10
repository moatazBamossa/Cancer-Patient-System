import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalItems?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
  headerActions?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  totalItems,
  page = 1,
  pageSize = 10,
  onPageChange,
  onSearch,
  onSort,
  searchPlaceholder,
  isLoading = false,
  emptyMessage,
  actions,
  headerActions,
  onRowClick,
}: DataTableProps<T>) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const isRtl = i18n.language === 'ar';

  const defaultSearchPlaceholder = t('common.search');
  const defaultEmptyMessage = t('dataTable.noData');

  const total = totalItems ?? data.length;
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  const handleSort = useCallback(
    (key: string) => {
      const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortKey(key);
      setSortOrder(newOrder);
      onSort?.(key, newOrder);
    },
    [sortKey, sortOrder, onSort]
  );

  const sortedData = useMemo(() => {
    if (!sortKey || onSort) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const dir = sortOrder === 'desc' ? -1 : 1;
      return aVal < bVal ? -1 * dir : aVal > bVal ? 1 * dir : 0;
    });
  }, [data, sortKey, sortOrder, onSort]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ArrowUpDown size={14} className="opacity-30" />;
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {onSearch && (
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className={cn("absolute top-1/2 -translate-y-1/2", isRtl ? "right-3" : "left-3")}
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder || defaultSearchPlaceholder}
              className={cn("input-field", isRtl ? "pr-9" : "pl-9")}
            />
          </div>
        )}
        {headerActions && <div className="flex gap-2 flex-shrink-0">{headerActions}</div>}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(col.sortable && 'cursor-pointer select-none', col.className)}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon columnKey={col.key} />}
                  </div>
                </th>
              ))}
              {actions && <th className="w-20">{t('dataTable.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="skeleton h-5 w-3/4 rounded" />
                    </td>
                  ))}
                  {actions && (
                    <td>
                      <div className="skeleton h-5 w-16 rounded" />
                    </td>
                  )}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    <p className="text-lg font-medium">{emptyMessage || defaultEmptyMessage}</p>
                    <p className="text-sm mt-1">{t('dataTable.tryAdjusting')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <motion.tr
                  key={String((row as any)['id'] ?? index)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render((row as any)[col.key], row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('dataTable.showing', { start: (page - 1) * pageSize + 1, end: Math.min(page * pageSize, total), total: total })}
          </p>
          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => onPageChange(1)}
              disabled={page === 1}
            >
              {isRtl ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </PaginationButton>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <PaginationButton
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  active={pageNum === page}
                >
                  {pageNum}
                </PaginationButton>
              );
            })}

            <PaginationButton
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
            >
              {isRtl ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all',
        active
          ? 'gradient-btn text-white shadow-none'
          : 'hover:bg-[var(--bg-hover)]',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
      style={{ color: active ? undefined : 'var(--text-secondary)' }}
    >
      {children}
    </button>
  );
}
