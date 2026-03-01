import { useSpeechService } from '../contexts/SpeechContext';

export function useSpeech() {
  const speech = useSpeechService();

  return {
    speak: speech.speak.bind(speech),
    stopSpeaking: speech.stopSpeaking.bind(speech),
    isSpeaking: speech.isSpeaking.bind(speech),
    isRecognitionSupported: speech.isRecognitionSupported.bind(speech),
    startRecognition: speech.startRecognition.bind(speech),
    stopRecognition: speech.stopRecognition.bind(speech),
    getMicrophonePermission: speech.getMicrophonePermission.bind(speech),
  };
}
