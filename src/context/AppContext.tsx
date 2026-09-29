import { createContext, useContext, useState, type ReactNode } from 'react';

export type ViewName = 'dashboard' | 'schedule' | 'checkout' | 'calendar' | 'archive';

interface AppContextValue {
  view: ViewName;
  setView: (v: ViewName) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewName>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppContext.Provider
      value={{ view, setView, refreshKey, triggerRefresh: () => setRefreshKey((k) => k + 1) }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
