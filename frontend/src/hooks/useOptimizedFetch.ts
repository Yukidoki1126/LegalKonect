import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedGet } from '../services/api';

interface FetchOptions {
  cacheTime?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export function useOptimizedFetch<T>(
  url: string | null,
  options: FetchOptions = {}
) {
  const {
    cacheTime = 2 * 60 * 1000, // 2 minutes default
    enabled = true,
    refetchOnMount = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(false);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    // Prevent duplicate fetches
    if (loading) return;

    // Skip if already fetched and not refetching on mount
    if (fetchedRef.current && !refetchOnMount && mountedRef.current) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await cachedGet<T>(url, cacheTime);
      setData(result);
      fetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url, enabled, cacheTime, refetchOnMount, loading]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchedRef.current = false;
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
