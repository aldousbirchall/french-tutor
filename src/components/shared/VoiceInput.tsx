import { useState, useCallback, useEffect } from 'react';
import { useSpeechService } from '../../contexts/SpeechContext';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  lang?: string;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  lang,
  isListening,
  onListeningChange,
}) => {
  const speech = useSpeechService();
  const [interimText, setInterimText] = useState('');
  const supported = speech.isRecognitionSupported();

  const startListening = useCallback(() => {
    if (!supported || isListening) return;
    onListeningChange(true);
    setInterimText('');
    speech.startRecognition({
      lang,
      onInterim: (text) => setInterimText(text),
      onFinal: (text) => {
        onTranscript(text);
        setInterimText('');
        onListeningChange(false);
      },
      onError: () => {
        setInterimText('');
        onListeningChange(false);
      },
    });
  }, [speech, lang, isListening, onTranscript, onListeningChange, supported]);

  const stopListening = useCallback(() => {
    speech.stopRecognition();
    onListeningChange(false);
    setInterimText('');
  }, [speech, onListeningChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Spacebar shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  if (!supported) {
    return (
      <div className={styles.container}>
        <span className={styles.unsupported}>
          Voice input is not supported in this browser.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
        onClick={toggleListening}
        title={isListening ? 'Stop listening' : 'Start speaking (or press Space)'}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? '⏹' : '🎤'}
      </button>
      {interimText && (
        <span className={styles.transcript}>{interimText}</span>
      )}
    </div>
  );
};

export default VoiceInput;
