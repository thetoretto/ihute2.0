import { useState, useCallback, useMemo, useEffect } from 'react';

export type TabConfig<TTab extends string> = {
  key: TTab;
  label: string;
};

export interface UseTabbedListOptions<TTab extends string, TItem> {
  tabs: TabConfig<TTab>[];
  initialTab: TTab;
  fetchData: () => Promise<TItem[]>;
  filterByTab: (item: TItem, tab: TTab) => boolean;
  deps?: unknown[];
}

export interface UseTabbedListResult<TTab extends string, TItem> {
  tab: TTab;
  setTab: (tab: TTab) => void;
  list: TItem[];
  data: TItem[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  setError: (error: string | null) => void;
}

export function useTabbedList<TTab extends string, TItem>({
  tabs,
  initialTab,
  fetchData,
  filterByTab,
  deps = [],
}: UseTabbedListOptions<TTab, TItem>): UseTabbedListResult<TTab, TItem> {
  const [tab, setTab] = useState<TTab>(initialTab);
  const [data, setData] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchData();
      setData(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    void load();
  }, [load, ...deps]);

  const list = useMemo(() => data.filter((item) => filterByTab(item, tab)), [data, tab, filterByTab]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const items = await fetchData();
      setData(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load data.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  return {
    tab,
    setTab,
    list,
    data,
    loading,
    error,
    refreshing,
    refresh,
    setError,
  };
}
