import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';

/**
 * Enhanced useFetch hook with retry, caching, and better error handling
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {array} dependencies - Dependencies for re-fetching
 * @returns {object} - { data, loading, error, refetch, mutate }
 */
export function useFetch(url, options = {}, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (retry = 0) => {
    if (!url) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(url, {
        ...options,
        signal: abortControllerRef.current.signal
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        setData(response.data);
        setError(null);
        setRetryCount(0);
      } else {
        setError({
          message: response.message,
          status: response.status,
          data: response.data
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }

      setError({
        message: err.message || 'An error occurred',
        status: err.status || 0,
        data: err.data || null
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, JSON.stringify(options)]);

  const refetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchData();
  }, [fetchData]);

  const mutate = useCallback((newData) => {
    setData(newData);
  }, []);

  const retry = useCallback(() => {
    if (retryCount < 3) {
      refetch();
    }
  }, [retryCount, refetch]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    retry,
    retryCount,
    isRetrying: retryCount > 0 && retryCount < 3
  };
}

/**
 * Hook for POST/PUT/DELETE operations
 * @param {string} url - API endpoint
 * @param {object} options - Default options
 * @returns {object} - { execute, loading, error, data }
 */
export function useMutation(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (mutationOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(url, {
        ...options,
        ...mutationOptions
      });

      if (response.ok) {
        setData(response.data);
        return response;
      } else {
        const error = {
          message: response.message,
          status: response.status,
          data: response.data
        };
        setError(error);
        throw error;
      }
    } catch (err) {
      const error = {
        message: err.message || 'An error occurred',
        status: err.status || 0,
        data: err.data || null
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  return {
    execute,
    data,
    loading,
    error,
    reset: () => {
      setData(null);
      setError(null);
    }
  };
}

/**
 * Hook for paginated data
 * @param {string} url - Base API endpoint
 * @param {object} options - Fetch options
 * @returns {object} - Pagination state and controls
 */
export function usePagination(url, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(async (pageNum = 1, append = false) => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`${url}?page=${pageNum}&limit=20`, options);

      if (response.ok) {
        const newData = response.data.data || response.data;
        const totalItems = response.data.total || newData.length;

        if (append) {
          setData(prev => [...prev, ...newData]);
        } else {
          setData(newData);
        }

        setTotal(totalItems);
        setHasMore(newData.length === 20 && data.length + newData.length < totalItems);
        setPage(pageNum);
      } else {
        setError({
          message: response.message,
          status: response.status
        });
      }
    } catch (err) {
      setError({
        message: err.message || 'An error occurred',
        status: err.status || 0
      });
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchPage(page + 1, true);
    }
  }, [hasMore, loading, page, fetchPage]);

  const refresh = useCallback(() => {
    setPage(1);
    setData([]);
    setHasMore(true);
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    total,
    loadMore,
    refresh,
    setPage: (newPage) => fetchPage(newPage, false)
  };
}

/**
 * Hook for real-time data updates
 * @param {string} url - API endpoint
 * @param {number} interval - Polling interval in milliseconds
 * @param {object} options - Fetch options
 * @returns {object} - Real-time data state
 */
export function useRealtime(url, interval = 30000, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiFetch(url, options);
      
      if (response.ok) {
        setData(response.data);
        setError(null);
        setIsConnected(true);
      } else {
        setError({
          message: response.message,
          status: response.status
        });
        setIsConnected(false);
      }
    } catch (err) {
      setError({
        message: err.message || 'Connection error',
        status: err.status || 0
      });
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, interval]);

  return {
    data,
    loading,
    error,
    isConnected,
    refetch: fetchData
  };
}
