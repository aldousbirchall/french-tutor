import { useState } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '../../utils/apiKey';
import styles from './ApiKeyForm.module.css';

function maskKey(key: string): string {
  if (key.length <= 4) return key;
  return '•'.repeat(key.length - 4) + key.slice(-4);
}

const ApiKeyForm: React.FC = () => {
  const [savedKey, setSavedKey] = useState<string | null>(getApiKey());
  const [inputValue, setInputValue] = useState('');

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setSavedKey(trimmed);
    setInputValue('');
  };

  const handleClear = () => {
    clearApiKey();
    setSavedKey(null);
  };

  return (
    <div className={styles.form}>
      {savedKey ? (
        <div className={styles.field}>
          <span className={styles.label}>API Key</span>
          <div className={styles.savedKey}>
            <span className={styles.maskedKey}>{maskKey(savedKey)}</span>
            <button className={styles.btnDanger} onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="api-key-input">
            Anthropic API Key
          </label>
          <div className={styles.inputRow}>
            <input
              id="api-key-input"
              type="password"
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="sk-ant-..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button className={styles.btnPrimary} onClick={handleSave}>
              Save
            </button>
          </div>
          <span className={styles.hint}>
            Your key is stored locally and never sent to any server other than the Anthropic API.
          </span>
        </div>
      )}
    </div>
  );
};

export default ApiKeyForm;
