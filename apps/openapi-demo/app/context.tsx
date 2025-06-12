import { createContext, useContext, useState, useEffect } from 'react';

// Create a context for the global state
export const GlobalStateContext = createContext<{
  actionData: any;
  setActionData: (data: any) => void;
}>({
  actionData: null,
  setActionData: () => { },
});

// Create a provider component
export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [actionData, setActionData] = useState<any>(null);

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