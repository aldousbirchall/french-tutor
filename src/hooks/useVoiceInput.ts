import { useState, useCallback } from 'react';

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState('');

  const handleTranscript = useCallback((text: string) => {
    setFinalText(text);
  }, []);

  const reset = useCallback(() => {
    setFinalText('');
    setIsListening(false);
  }, []);

  return {
    isListening,
    setIsListening,
    finalText,
    handleTranscript,
    reset,
  };
}
