import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const DataContext = createContext<{ version: number; refresh: () => void } | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const value = useMemo(() => ({ version, refresh: () => setVersion((prev) => prev + 1) }), [version]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData exige DataProvider');
  return value;
}
