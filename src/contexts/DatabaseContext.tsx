import { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from '../services/database';

const DatabaseContext = createContext<DatabaseService | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [service, setService] = useState<DatabaseService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = new DatabaseService();
    db.init()
      .then(() => setService(db))
      .catch((err) => setError(`Failed to initialize database: ${err.message}`));
  }, []);

  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
  }

  if (!service) {
    return <div style={{ padding: '2rem' }}>Loading database...</div>;
  }

  return (
    <DatabaseContext.Provider value={service}>
      {children}
    </DatabaseContext.Provider>
  );
};

export function useDatabaseService(): DatabaseService {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabaseService must be used within DatabaseProvider');
  return ctx;
}
