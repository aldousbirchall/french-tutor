/* eslint-disable @typescript-eslint/no-explicit-any */

export class SpeechService {
  private recognition: any = null;

  isRecognitionSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  startRecognition(params: {
    lang?: string;
    onInterim: (text: string) => void;
    onFinal: (text: string) => void;
    onError: (error: string) => void;
  }): void {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      params.onError('Speech recognition is not supported in this browser.');
      return;
    }

    this.stopRecognition();

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = params.lang ?? 'fr-CH';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        params.onFinal(finalTranscript);
      } else if (interimTranscript) {
        params.onInterim(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      params.onError(`Speech recognition error: ${event.error}`);
    };

    recognition.start();
    this.recognition = recognition;
  }

  stopRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
      this.recognition = null;
    }
  }

  speak(text: string, options?: {
    lang?: string;
    rate?: number;
    onEnd?: () => void;
  }): void {
    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 0.9;

    const voice = this.selectFrenchVoice(options?.lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = options?.lang ?? 'fr-FR';
    }

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    window.speechSynthesis.cancel();
  }

  isSpeaking(): boolean {
    return window.speechSynthesis.speaking;
  }

  async getMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch {
      return 'prompt';
    }
  }

  private selectFrenchVoice(preferredLang?: string): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    const lang = preferredLang ?? 'fr-FR';

    // Prefer fr-CH
    const chVoice = voices.find((v) => v.lang === 'fr-CH');
    if (chVoice) return chVoice;

    // Then exact match
    const exactVoice = voices.find((v) => v.lang === lang);
    if (exactVoice) return exactVoice;

    // Then any fr-FR
    const frVoice = voices.find((v) => v.lang === 'fr-FR');
    if (frVoice) return frVoice;

    // Then any fr-*
    const anyFrVoice = voices.find((v) => v.lang.startsWith('fr'));
    if (anyFrVoice) return anyFrVoice;

    return null;
  }
}
