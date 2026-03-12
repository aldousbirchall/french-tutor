/* eslint-disable @typescript-eslint/no-explicit-any */

/** Silence detection timeout in milliseconds. After 1.5 seconds of no speech, recording stops automatically. */
const SILENCE_TIMEOUT_MS = 1500;

export class SpeechService {
  private recognition: any = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;

  isRecognitionSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private resetSilenceTimer(recognition: any): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
    }, SILENCE_TIMEOUT_MS);
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

    // Start silence detection timer
    this.resetSilenceTimer(recognition);

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

      // Reset silence timer on any speech activity
      this.resetSilenceTimer(recognition);

      if (finalTranscript) {
        this.clearSilenceTimer();
        params.onFinal(finalTranscript);
      } else if (interimTranscript) {
        params.onInterim(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      this.clearSilenceTimer();
      if (event.error === 'no-speech') return;
      params.onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      this.clearSilenceTimer();
    };

    recognition.start();
    this.recognition = recognition;
  }

  stopRecognition(): void {
    this.clearSilenceTimer();
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
    const frVoices = voices.filter((v) => v.lang.startsWith('fr'));
    if (frVoices.length === 0) return null;

    // Prefer high-quality named voices (macOS premium voices)
    const preferredNames = ['Thomas', 'Jacques', 'Audrey', 'Aurelie'];
    for (const name of preferredNames) {
      const match = frVoices.find((v) => v.name === name);
      if (match) return match;
    }

    // Avoid novelty voices
    const novelty = new Set(['Eddy', 'Flo', 'Grandma', 'Grandpa', 'Rocko', 'Sandy', 'Shelley', 'Reed']);
    const goodVoices = frVoices.filter((v) => {
      const firstName = v.name.split(' ')[0].split('(')[0].trim();
      return !novelty.has(firstName);
    });

    // Prefer fr-FR over fr-CA for European French
    const lang = preferredLang ?? 'fr-FR';
    const langMatch = goodVoices.find((v) => v.lang === lang) ?? goodVoices[0];
    if (langMatch) return langMatch;

    // Last resort: any French voice
    return frVoices[0];
  }
}
