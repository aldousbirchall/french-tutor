# french-tutor -- Build Status

## Phase: Delivered

Build complete. All holdout tests pass (139/143, 4 skipped). Review: 88/100. Security: PASS WITH FINDINGS.

### What's Built
- React 18 + Vite + TypeScript SPA (99 source files)
- Four modes: Vocabulary (FSRS), Conversation (Claude streaming), Exam (8 scenario types), Dashboard
- Voice I/O via Web Speech API (STT: fr-CH, TTS: rate 0.9)
- IndexedDB persistence (4 object stores)
- 33-day study schedule, 671-word vocabulary, 8 exam scenario types
- WCAG 2.1 AA compliant, responsive to 2560px

### How to Run
```
npm install && npm run dev
# Open http://localhost:5173, enter Anthropic API key
```

### Verification Summary
- Iteration 1: 59 failures (43 impl + 16 test-side)
- Iteration 2: 6 failures (3 impl + 3 test-side)
- Iteration 3: 0 failures, all pass

### Decisions
- Project type: web-frontend (browser-only SPA)
- Stack: React 18 + Vite + TypeScript
- No backend, no containerisation, no deployment
- Voice: Web Speech API (STT) + SpeechSynthesis (TTS)
- SRS: ts-fsrs library
- Persistence: IndexedDB
- Claude API: direct from browser with streaming (Anthropic JS SDK)
