import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ClaudeService } from '../services/claude';

interface ClaudeContextValue {
  service: ClaudeService;
  available: boolean;
  checked: boolean;
}

const ClaudeContext = createContext<ClaudeContextValue | null>(null);

export const ClaudeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const service = useMemo(() => new ClaudeService(), []);
  const [available, setAvailable] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    service.checkAvailability().then((ok) => {
      setAvailable(ok);
      setChecked(true);
    });
  }, [service]);

  const value = useMemo(() => ({ service, available, checked }), [service, available, checked]);

  return (
    <ClaudeContext.Provider value={value}>
      {children}
    </ClaudeContext.Provider>
  );
};

export function useClaudeService(): ClaudeService {
  const ctx = useContext(ClaudeContext);
  if (!ctx) throw new Error('useClaudeService must be used within ClaudeProvider');
  return ctx.service;
}

export function useClaudeAvailability(): { available: boolean; checked: boolean } {
  const ctx = useContext(ClaudeContext);
  if (!ctx) throw new Error('useClaudeAvailability must be used within ClaudeProvider');
  return { available: ctx.available, checked: ctx.checked };
}
