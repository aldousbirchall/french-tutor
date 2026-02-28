# french-tutor -- Build Status

## Phase: Specification

### State
- Workspace created
- Requirements loaded from projects/french-tutor/requirements.md
- Curriculum data available at projects/french-tutor/curriculum/
- Spec agent dispatched

### Decisions
- Project type: web-frontend (browser-only SPA)
- Stack: React 18 + Vite + TypeScript
- No backend, no containerisation, no deployment
- Voice: Web Speech API (STT) + SpeechSynthesis (TTS)
- SRS: ts-fsrs library
- Persistence: IndexedDB
- Claude API: direct from browser with streaming (Anthropic JS SDK)
