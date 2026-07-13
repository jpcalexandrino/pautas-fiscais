import { useState, useMemo, useEffect } from 'react';
import type { TableState } from '@tanstack/react-table';

export interface UseClientTableProps<T> {
  data: T[];
  defaultPageSize?: number;
  customFilterHandlers?: Record<string, (item: T, searchValue: string) => boolean>;
  storageKey?: string;
}

export function useClientTable<T extends Record<string, any>>({
  data,
  defaultPageSize = 20,
  customFilterHandlers = {},
  storageKey,
}: UseClientTableProps<T>) {
  const [tableState, setTableState] = useState<Partial<TableState>>(() => {
    if (storageKey) {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
    }
    return {
      pagination: {
        pageIndex: 0,
        pageSize: defaultPageSize,
      },
      columnFilters: [],
    };
  });

  useEffect(() => {
    if (storageKey) {
      sessionStorage.setItem(storageKey, JSON.stringify(tableState));
    }
  }, [tableState, storageKey]);

  const filteredData = useMemo(() => {
    let result = data;
    const filters = tableState.columnFilters || [];

    for (const filter of filters) {
      const { id, value } = filter;
      if (value === undefined || value === null || value === '') continue;

      const searchValue = String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      if (customFilterHandlers[id]) {
        result = result.filter((item) => customFilterHandlers[id](item, searchValue));
      } else {
        result = result.filter((item) => {
          const itemVal = item[id];
          if (itemVal === undefined || itemVal === null) return false;
          return String(itemVal)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .includes(searchValue);
        });
      }
    }

    return result;
  }, [data, tableState.columnFilters, customFilterHandlers]);

  const paginatedData = useMemo(() => {
    const pageIndex = tableState.pagination?.pageIndex ?? 0;
    const pageSize = tableState.pagination?.pageSize ?? defaultPageSize;
    const start = pageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, tableState.pagination, defaultPageSize]);

  const onPaginationChange = (updater: any) => {
    setTableState((prev) => {
      const current = prev.pagination ?? { pageIndex: 0, pageSize: defaultPageSize };
      const next = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        pagination: next,
      };
    });
  };

  const onColumnFiltersChange = (updater: any) => {
    setTableState((prev) => {
      const current = prev.columnFilters ?? [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        columnFilters: next,
        pagination: prev.pagination ? { ...prev.pagination, pageIndex: 0 } : undefined,
      };
    });
  };

  return {
    tableState,
    setTableState,
    filteredData,
    paginatedData,
    onPaginationChange,
    onColumnFiltersChange,
    paginationProps: {
      totalItems: filteredData.length,
      totalPages: Math.ceil(filteredData.length / (tableState.pagination?.pageSize ?? defaultPageSize)),
      pageSize: tableState.pagination?.pageSize ?? defaultPageSize,
    },
  };
}
