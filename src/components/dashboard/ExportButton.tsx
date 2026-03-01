import { useCallback, useState } from 'react';
import { useDatabaseService } from '../../contexts/DatabaseContext';

const ExportButton: React.FC = () => {
  const db = useDatabaseService();
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const data = await db.exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `french-tutor-export-${dateStr}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [db]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      style={{
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--border-radius)',
        cursor: exporting ? 'not-allowed' : 'pointer',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      {exporting ? 'Exporting...' : 'Export Data'}
    </button>
  );
};

export default ExportButton;
