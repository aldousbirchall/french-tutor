import { useState, useCallback, useEffect } from 'react';
import { useExamSession } from '../../../hooks/useExamSession';
import { matchTaskHint } from '../../../utils/taskHintMatch';
import ExamScoreCard from '../ExamScoreCard';
import styles from './scenarios.module.css';

interface FormFillingUIProps {
  scenarioId: string;
  taskHint?: string;
  onBack: () => void;
}

interface FormDef {
  id: string;
  title: string;
  situation: string;
  fields: Array<{
    label: string;
    type: string;
    options?: string[];
  }>;
}

const FormFillingUI: React.FC<FormFillingUIProps> = ({ scenarioId, taskHint, onBack }) => {
  const { scenario, examScores, submitForScoring, reset } = useExamSession(scenarioId);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const forms = (scenario?.forms as FormDef[]) ?? [];
  const autoMatch = matchTaskHint(taskHint, forms.map((f) => ({ id: f.id, desc: `${f.title} ${f.situation}` })));
  const [selectedForm, setSelectedForm] = useState<string | null>(autoMatch);
  const currentForm = forms.find((f) => f.id === selectedForm);

  // Auto-select first form when forms are available and no hint match
  useEffect(() => {
    if (forms.length > 0 && !selectedForm) {
      setSelectedForm(forms[0].id);
    }
  }, [forms, selectedForm]);

  const handleFieldChange = useCallback((label: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [label]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentForm) return;
    const lines = currentForm.fields.map((f) => `${f.label}: ${fieldValues[f.label] ?? ''}`);
    submitForScoring(`Form: ${currentForm.title}\nSituation: ${currentForm.situation}\n\n${lines.join('\n')}`);
  }, [currentForm, fieldValues, submitForScoring]);

  if (examScores) {
    return (
      <ExamScoreCard scores={examScores.scores} totalPercent={examScores.totalPercent} feedback={examScores.feedback} onRetry={reset} onBack={onBack} />
    );
  }

  if (!selectedForm) {
    return (
      <div className={styles.scenario}>
        <h2 className={styles.title}>Choose a Form</h2>
        {forms.map((f) => (
          <div key={f.id} className={styles.promptCard} style={{ cursor: 'pointer' }} onClick={() => setSelectedForm(f.id)}>
            <strong>{f.title}</strong>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{f.situation}</p>
          </div>
        ))}
      </div>
    );
  }

  if (!currentForm) return null;

  return (
    <div className={styles.scenario}>
      <h2 className={styles.title}>{currentForm.title}</h2>
      <div className={styles.situation}>{currentForm.situation}</div>

      <div className={styles.form}>
        {currentForm.fields.map((field) => (
          <div key={field.label} className={styles.formField}>
            <label className={styles.formLabel}>{field.label}</label>
            {field.type === 'select' && field.options ? (
              <select
                className={styles.formSelect}
                value={fieldValues[field.label] ?? ''}
                onChange={(e) => handleFieldChange(field.label, e.target.value)}
              >
                <option value="">--</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                className={styles.formInput}
                type={field.type === 'date' ? 'text' : field.type}
                value={fieldValues[field.label] ?? ''}
                onChange={(e) => handleFieldChange(field.label, e.target.value)}
                placeholder={field.type === 'date' ? 'JJ.MM.AAAA' : ''}
              />
            )}
          </div>
        ))}
      </div>

      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit} style={{ marginTop: '1rem' }}>
        Submit Form
      </button>
    </div>
  );
};

export default FormFillingUI;
