import { createContext, useContext, useState, useEffect } from 'react';
import type { Reference } from '@xyd-js/uniform';
import type { Settings } from '@xyd-js/core';
import type { FwSidebarGroupProps } from '@xyd-js/framework/react';
import { SETTINGS } from './routes/settings';

interface GlobalStateActionData {
  references: Reference[];
  settings: Settings
  groups: FwSidebarGroupProps[]
  exampleType: "openapi" | "graphql"
}

// Create a context for the global state
export const GlobalStateContext = createContext<{
  actionData: GlobalStateActionData | null;
  setActionData: (data: GlobalStateActionData) => void;
}>({
  actionData: null,
  setActionData: () => { },
});

// Create a provider component
export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [actionData, setActionData] = useState<any>({
    references: [],
    settings: SETTINGS,
    groups: [],
    exampleType: ""
  });

  const handleSetActionData = (data: any) => {
    setActionData(data);
  };
  
  return (
    <GlobalStateContext.Provider value={{ actionData, setActionData: handleSetActionData }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Custom hook for using the global state
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
} 

export const UrlContext = createContext({})
