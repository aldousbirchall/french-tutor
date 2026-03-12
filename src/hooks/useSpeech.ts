import { useSpeechService } from '../contexts/SpeechContext';

export function useSpeech() {
  const speech = useSpeechService();

  return {
    speak: speech.speak.bind(speech),
    stopSpeaking: speech.stopSpeaking.bind(speech),
    isSpeaking: speech.isSpeaking.bind(speech),
  };
}
