export class SpeechService {
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
