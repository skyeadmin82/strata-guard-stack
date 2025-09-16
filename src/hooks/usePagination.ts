import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialTotal?: number;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialTotal = 0,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(initialTotal);

  const paginationState = useMemo<PaginationState>(() => {
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      offset,
      hasNextPage,
      hasPreviousPage,
    };
  }, [page, limit, total]);

  const goToPage = useCallback((newPage: number) => {
    const totalPages = Math.ceil(total / limit);
    const validPage = Math.min(Math.max(1, newPage), totalPages);
    setPage(validPage);
  }, [total, limit]);

  const nextPage = useCallback(() => {
    if (paginationState.hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [paginationState.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationState.hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [paginationState.hasPreviousPage]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    // Adjust page to maintain position
    const currentOffset = (page - 1) * limit;
    const newPage = Math.floor(currentOffset / newLimit) + 1;
    setPage(newPage);
  }, [page, limit]);

  const updateTotal = useCallback((newTotal: number) => {
    setTotal(newTotal);
    // Adjust page if it exceeds new total pages
    const totalPages = Math.ceil(newTotal / limit);
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, limit]);

  const reset = useCallback(() => {
    setPage(1);
    setTotal(0);
  }, []);

  const getPageNumbers = useCallback((maxVisible: number = 5) => {
    const totalPages = paginationState.totalPages;
    const current = paginationState.page;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [paginationState.page, paginationState.totalPages]);

  return {
    ...paginationState,
    goToPage,
    nextPage,
    previousPage,
    changeLimit,
    updateTotal,
    reset,
    getPageNumbers,
  };
};

// Advanced pagination with server-side support
export interface UseServerPaginationOptions<T> {
  fetchFn: (page: number, limit: number, filters?: any) => Promise<{ data: T[]; total: number }>;
  initialPage?: number;
  initialLimit?: number;
  filters?: any;
  cacheKey?: string;
}

export const useServerPagination = <T>(options: UseServerPaginationOptions<T>) => {
  const {
    fetchFn,
    initialPage = 1,
    initialLimit = 10,
    filters = {},
    cacheKey,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, { data: T[]; total: number; timestamp: number }>>(new Map());

  const pagination = usePagination({
    initialPage,
    initialLimit,
  });

  const getCacheKey = useCallback((page: number, limit: number, filters: any) => {
    return `${cacheKey || 'default'}-${page}-${limit}-${JSON.stringify(filters)}`;
  }, [cacheKey]);

  const fetchData = useCallback(async (page: number, limit: number, useCache: boolean = true) => {
    const key = getCacheKey(page, limit, filters);
    const cached = cache.get(key);
    const now = Date.now();
    const cacheValidTime = 5 * 60 * 1000; // 5 minutes

    if (useCache && cached && (now - cached.timestamp) < cacheValidTime) {
      setData(cached.data);
      pagination.updateTotal(cached.total);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, limit, filters);
      
      setData(result.data);
      pagination.updateTotal(result.total);

      // Cache the result
      setCache(prev => new Map(prev).set(key, {
        data: result.data,
        total: result.total,
        timestamp: now,
      }));

    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, filters, pagination, cache, getCacheKey]);

  const goToPage = useCallback((newPage: number) => {
    pagination.goToPage(newPage);
    fetchData(newPage, pagination.limit);
  }, [pagination, fetchData]);

  const changeLimit = useCallback((newLimit: number) => {
    pagination.changeLimit(newLimit);
    fetchData(1, newLimit);
  }, [pagination, fetchData]);

  const refresh = useCallback(() => {
    fetchData(pagination.page, pagination.limit, false);
  }, [fetchData, pagination.page, pagination.limit]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // Refetch when filters change
  React.useEffect(() => {
    pagination.goToPage(1);
    fetchData(1, pagination.limit, false);
  }, [filters]);

  return {
    data,
    loading,
    error,
    pagination,
    goToPage,
    changeLimit,
    refresh,
    clearCache,
    nextPage: () => goToPage(pagination.page + 1),
    previousPage: () => goToPage(pagination.page - 1),
  };
};