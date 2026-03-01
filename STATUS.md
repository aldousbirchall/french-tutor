# french-tutor -- Build Status

## Phase: Delivered + UX Hotfix

Build complete. All holdout tests pass (139/143, 4 skipped). Review: 88/100. Security: PASS WITH FINDINGS.

### UX Improvements (2026-03-01, manual hotfix)

**Added:**
- ModeIntro collapsible instruction panel on every mode (Vocabulary, Conversation, Exam, Dashboard, Settings)
- ThinkingIndicator (animated dots) in conversation when waiting for first token
- ConversationEmptyState with numbered steps, topic hint, suggested opener, Space key hint
- Scaffolding level descriptions below the button row
- Conversation input area split into labelled voice/text zones with divider
- Vocabulary flashcard hint: "Say the word aloud in French:" above mic button
- Reference tab with 6 sub-tabs: Exam Overview, Vocabulary Browser (search/filter 671 words), Grammar Guide, Exam Tasks, Study Schedule (current day highlighted), Useful Links
- 16 new files, 11 modified files

**Key fix:** Flashcard voice input expects French pronunciation (lang="fr-CH"), not English translation. Nothing indicated this before. Now explained in ModeIntro and on-card hint.

### What's Built
- React 18 + Vite + TypeScript SPA (115 source files)
- Five modes: Vocabulary (FSRS), Conversation (Claude streaming), Exam (8 scenario types), Dashboard, Reference
- Voice I/O via Web Speech API (STT: fr-CH, TTS: rate 0.9)
- IndexedDB persistence (4 object stores)
- 23-day study schedule, 671-word vocabulary, 8 exam scenario types
- WCAG 2.1 AA compliant, responsive to 2560px

### How to Run
```
npm install && npm run dev
# Open http://localhost:5173, enter Anthropic API key
```

### What's Next
- Manual verification of all UX changes in browser
- Conversation mode: consider adding translation toggle for flashcards (type English answer as alternative to voice)

### Verification Summary
- Iteration 1: 59 failures (43 impl + 16 test-side)
- Iteration 2: 6 failures (3 impl + 3 test-side)
- Iteration 3: 0 failures, all pass
- UX hotfix: `npm run build` clean (178 modules, 0 errors)

### Decisions
- Project type: web-frontend (browser-only SPA)
- Stack: React 18 + Vite + TypeScript
- No backend, no containerisation, no deployment
- Voice: Web Speech API (STT) + SpeechSynthesis (TTS)
- SRS: ts-fsrs library
- Persistence: IndexedDB
- Claude API: direct from browser with streaming (Anthropic JS SDK)
