import { useEffect, useMemo, useState } from "react";

type UseToolDataOptions<T> = {
  fallbackData?: T;
  enabled?: boolean;
};

type UseToolDataResult<T> = {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  refresh: () => void;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "Unknown error");
};

export const useToolData = <T>(url: string | null, options: UseToolDataOptions<T> = {}): UseToolDataResult<T> => {
  const { fallbackData, enabled = true } = options;
  const [data, setData] = useState<T | undefined>(fallbackData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(url && enabled && !fallbackData));
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = () => {
    setRefreshToken((value) => value + 1);
  };

  const activeKey = useMemo(() => {
    if (!url || !enabled) {
      return null;
    }
    return `${url}::${refreshToken}`;
  }, [enabled, url, refreshToken]);

  useEffect(() => {
    if (!activeKey) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url!, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const json = (await response.json()) as T;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(normalizeError(err));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeKey, url]);

  return {
    data,
    error,
    isLoading,
    refresh,
  };
};

export default useToolData;
