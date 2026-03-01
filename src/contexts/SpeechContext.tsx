import { createContext, useContext, useMemo } from 'react';
import { SpeechService } from '../services/speech';

const SpeechContext = createContext<SpeechService | null>(null);

export const SpeechProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const service = useMemo(() => new SpeechService(), []);
  return (
    <SpeechContext.Provider value={service}>
      {children}
    </SpeechContext.Provider>
  );
};

export function useSpeechService(): SpeechService {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error('useSpeechService must be used within SpeechProvider');
  return ctx;
}
