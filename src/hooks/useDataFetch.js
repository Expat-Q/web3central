import { useState, useEffect, useCallback, useRef } from 'react';
import { getErrorMessage } from '../lib/errors';

export const DataState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

export function useDataFetch(fetchFn, options = {}) {
  const {
    immediate = true,
    deps = [],
    onSuccess,
    onError,
    initialData = null
  } = options;

  const [state, setState] = useState(DataState.IDLE);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (...args) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (!mountedRef.current) return;

    setState(DataState.LOADING);
    setError(null);

    try {
      const result = await fetchFnRef.current(...args, { signal });

      if (!mountedRef.current) return;

      setData(result);
      setState(DataState.SUCCESS);
      onSuccess?.(result);
      return result;
    } catch (err) {
      if (!mountedRef.current) return;

      if (err.name === 'AbortError') {
        return;
      }

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setState(DataState.ERROR);
      onError?.(err);
      throw err;
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setState(DataState.IDLE);
    setData(initialData);
    setError(null);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    error,
    state,
    isLoading: state === DataState.LOADING,
    isSuccess: state === DataState.SUCCESS,
    isError: state === DataState.ERROR,
    isIdle: state === DataState.IDLE,
    execute,
    reset,
    setData
  };
}

export function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError, onSettled } = options;

  const [state, setState] = useState(DataState.IDLE);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(async (...args) => {
    if (!mountedRef.current) return;

    setState(DataState.LOADING);
    setError(null);

    try {
      const result = await mutationFn(...args);

      if (!mountedRef.current) return;

      setData(result);
      setState(DataState.SUCCESS);
      onSuccess?.(result);
      onSettled?.(result, null);
      return result;
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setState(DataState.ERROR);
      onError?.(err);
      onSettled?.(null, err);
      throw err;
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setState(DataState.IDLE);
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    error,
    state,
    isLoading: state === DataState.LOADING,
    isSuccess: state === DataState.SUCCESS,
    isError: state === DataState.ERROR,
    isIdle: state === DataState.IDLE,
    mutate,
    reset
  };
}
