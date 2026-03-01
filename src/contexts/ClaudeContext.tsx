import { createContext, useContext, useMemo } from 'react';
import { ClaudeService } from '../services/claude';

const ClaudeContext = createContext<ClaudeService | null>(null);

export const ClaudeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const service = useMemo(() => new ClaudeService(), []);
  return (
    <ClaudeContext.Provider value={service}>
      {children}
    </ClaudeContext.Provider>
  );
};

export function useClaudeService(): ClaudeService {
  const ctx = useContext(ClaudeContext);
  if (!ctx) throw new Error('useClaudeService must be used within ClaudeProvider');
  return ctx;
}
