# french-tutor -- Build Status

## Phase: Active use
**Updated**: 2026-03-12

Build complete + extensive post-build iteration. All text-only input. TTS pronunciation retained.

### What's Built
- React 18 + Vite + TypeScript SPA
- Five modes: Vocabulary (FSRS), Conversation (Claude streaming), Exam (8 scenario types), Dashboard, Reference
- TTS via SpeechSynthesis (premium macOS voices). No voice input (removed).
- IndexedDB persistence (4 object stores)
- 23-day study schedule, 710-word vocabulary, 8 exam scenario types
- Claude Code Max keychain OAuth auth via Vite proxy
- Graceful degradation when Claude unavailable

### How to Run
```
npm install && npm run dev
# Open http://localhost:5173 — auto-connects via Claude Code Max keychain
```

### Recent Changes (2026-03-12)
- Claude Code Max keychain auth (no separate API key)
- Graceful degradation (offline modes work, Claude-dependent modes disabled)
- Dialogue picker for Read/Quiz (not sequential-only)
- Topic picker for Live conversations
- Schedule navigator (all days, not just today)
- Deep-linking from dashboard activities to specific exercises
- Auto-complete schedule activities on session finish
- Fide-format conversations (~8 exchanges, examiner role, CEFR assessment)
- All voice input removed (unreliable). Text-only across all modes.
- English hints removed from form filling exercises
- ModeIntro collapsed to inline pill (no scroll issues)

### Decisions
- Stack: React 18 + Vite + TypeScript (browser SPA)
- Auth: Claude Code Max keychain OAuth via Vite dev server proxy
- No voice input. TTS for pronunciation only.
- SRS: ts-fsrs library
- Persistence: IndexedDB
- Claude model: claude-sonnet-4-20250514
- Conversations: ~8 exchanges, Fide oral exam format
