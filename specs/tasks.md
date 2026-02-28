# Implementation Tasks: french-tutor

## Critical Path

TASK-001 > TASK-002 > TASK-003 > TASK-004 > TASK-005 > TASK-006 > TASK-008 > TASK-009 > TASK-010 > TASK-011 > TASK-012 > TASK-013

The critical path runs through scaffolding, data layer, services, shared components, then each mode in order, finishing with the dashboard (which depends on data from all other modes).

## Tasks

### TASK-001: Project scaffolding
- **Component**: Build tooling, project structure
- **Files**: `package.json`, `tsconfig.json`, `vite.config.ts`, `.eslintrc.cjs`, `src/main.tsx`, `src/styles/variables.css`, `src/styles/reset.css`, `src/styles/global.css`, `public/index.html`
- **Dependencies**: None
- **Acceptance Criteria**: `npm install` succeeds. `npm run dev` starts the Vite dev server and renders a blank page. `npm run build` produces output in `dist/`. TypeScript strict mode is enabled. ESLint runs without config errors.
- **Complexity**: S
- **Notes**: Install dependencies: react, react-dom, react-router-dom, ts-fsrs, @anthropic-ai/sdk. Dev dependencies: typescript, vite, @vitejs/plugin-react, vitest, eslint, @typescript-eslint/eslint-plugin, @typescript-eslint/parser. CSS custom properties defined in variables.css per design.md token table.

### TASK-002: Bundled curriculum data modules
- **Component**: Data layer
- **Files**: `src/data/schedule.ts`, `src/data/vocabulary.ts`, `src/data/scenarios.ts`, `src/data/types.ts`
- **Dependencies**: TASK-001
- **Acceptance Criteria**: Each module exports typed data from the corresponding JSON file. TypeScript compiles without errors. The vocabulary module exports 671 words. The schedule module exports 23 days. The scenarios module exports all 8 scenario types. Type interfaces match the design.md specifications.
- **Complexity**: S
- **Notes**: Copy curriculum JSON files into `src/data/` and import them. Vite supports JSON imports natively. Define TypeScript interfaces in `types.ts` and re-export typed data from each module.

### TASK-003: App shell, routing, and settings page
- **Component**: AppShell, Sidebar, SettingsPage, ApiKeyForm, React Router
- **Files**: `src/App.tsx`, `src/components/layout/AppShell.tsx`, `src/components/layout/AppShell.module.css`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Sidebar.module.css`, `src/components/settings/SettingsPage.tsx`, `src/components/settings/SettingsPage.module.css`, `src/components/settings/ApiKeyForm.tsx`, `src/components/settings/ApiKeyForm.module.css`
- **Dependencies**: TASK-001
- **Acceptance Criteria**: The app renders a sidebar with four mode entries (Vocabulary, Conversation, Exam, Dashboard) and a settings button. Clicking a mode entry navigates to its route. The active route is highlighted in the sidebar. The sidebar collapses to icons at viewport widths below 768px. If no API key is in localStorage, the app redirects to `/settings`. The settings page allows entering, masking (last 4 characters visible), and clearing the API key. The key is stored in and removed from localStorage.
- **Complexity**: M
- **Notes**: Use React Router v6 with `<Outlet>` for the main content area. Implement REQ-001, REQ-002, REQ-NFR-002 (browser compatibility warning banner), REQ-NFR-003 (responsive layout).

### TASK-004: Service layer (Claude, Speech, Database)
- **Component**: ClaudeService, SpeechService, DatabaseService, contexts
- **Files**: `src/services/claude.ts`, `src/services/speech.ts`, `src/services/database.ts`, `src/services/types.ts`, `src/contexts/ClaudeContext.tsx`, `src/contexts/SpeechContext.tsx`, `src/contexts/DatabaseContext.tsx`
- **Dependencies**: TASK-001
- **Acceptance Criteria**: ClaudeService sends streaming messages via the Anthropic SDK with `dangerouslyAllowBrowser: true` and model `claude-sonnet-4-20250514`. API errors are mapped to AppError types with user-friendly messages (401 suggests checking API key). SpeechService provides STT (lang fr-CH, continuous false) and TTS (best French voice, rate 0.9). SpeechService detects browser support and microphone permission status. DatabaseService opens IndexedDB "french-tutor-db" with version 1, creates all four object stores with indexes per design.md, and provides typed CRUD methods. All three services are accessible via React context providers.
- **Complexity**: L
- **Notes**: Implements REQ-007, REQ-011, REQ-012. The DatabaseService migration pattern follows the design.md specification. The ClaudeService returns an AbortController for cancellation. Speech voice selection: prefer fr-CH, fall back to fr-FR, then any fr-* voice.

### TASK-005: Shared components (ErrorBoundary, VoiceInput, MiniLineChart, ExamTimer)
- **Component**: Shared UI components
- **Files**: `src/components/shared/ErrorBoundary.tsx`, `src/components/shared/VoiceInput.tsx`, `src/components/shared/VoiceInput.module.css`, `src/components/shared/MiniLineChart.tsx`, `src/components/shared/MiniLineChart.module.css`, `src/components/shared/ExamTimer.tsx`, `src/components/shared/ExamTimer.module.css`
- **Dependencies**: TASK-004
- **Acceptance Criteria**: ErrorBoundary catches errors in child components, renders a fallback with error message and retry button, and logs to console. VoiceInput renders a microphone button, responds to spacebar, shows interim and final transcription, and delegates to SpeechService. MiniLineChart renders an SVG line chart from `{x, y}[]` data. ExamTimer counts down from a given duration, turns red at 5 minutes remaining with a pulse animation, and calls onExpired when reaching zero.
- **Complexity**: M
- **Notes**: VoiceInput is used by vocabulary, conversation, and oral exam modes. MiniLineChart is used by the dashboard. ExamTimer is used by full mock exam mode. Implements REQ-005 (partial, voice input component), REQ-015 (partial, timer component).

### TASK-006: Utility modules
- **Component**: Utils
- **Files**: `src/utils/dateUtils.ts`, `src/utils/textMatch.ts`, `src/utils/formatters.ts`
- **Dependencies**: TASK-001
- **Acceptance Criteria**: `dateUtils.getCurrentStudyDay(startDate, today)` returns the correct study day number skipping weekends, or null if outside the study period. `textMatch.matchFrenchWord(attempt, expected)` returns true for case-insensitive, accent-stripped matches (Unicode NFD normalisation with diacritics removed). `formatters` provides duration formatting (seconds to mm:ss), percentage formatting, and date formatting (ISO to display).
- **Complexity**: S
- **Notes**: The study day calculation must match the schedule.json dates exactly. Weekend detection uses `getDay()` (0=Sunday, 6=Saturday). Accent stripping uses `normalize('NFD').replace(/[\u0300-\u036f]/g, '')`.

### TASK-007: Custom hooks
- **Component**: Hooks
- **Files**: `src/hooks/useCards.ts`, `src/hooks/useFSRS.ts`, `src/hooks/useConversation.ts`, `src/hooks/useExamSession.ts`, `src/hooks/useSchedule.ts`, `src/hooks/useSpeech.ts`, `src/hooks/useVoiceInput.ts`
- **Dependencies**: TASK-004, TASK-006
- **Acceptance Criteria**: `useCards` returns cards due for review, new cards (optionally filtered by topic), and a `rateCard` function that updates FSRS state. `useFSRS` returns a configured FSRS instance. `useConversation` manages message history (up to 20 turns), streaming state, and assessment retrieval. `useExamSession` manages scenario loading, turn state, and scoring via Claude. `useSchedule` returns the current study day data and activity completion status. `useSpeech` provides STT and TTS from context. `useVoiceInput` manages listening state, interim text, and final text.
- **Complexity**: M
- **Notes**: `useCards` composes `useFSRS` and DatabaseService. `useConversation` composes ClaudeService and DatabaseService. The daily new card limit is 25.

### TASK-008: Vocabulary drill mode
- **Component**: VocabularyMode, VocabSummaryBar, TopicFilter, FlashCard, SessionComplete
- **Files**: `src/components/vocabulary/VocabularyMode.tsx`, `src/components/vocabulary/VocabularyMode.module.css`, `src/components/vocabulary/VocabSummaryBar.tsx`, `src/components/vocabulary/VocabSummaryBar.module.css`, `src/components/vocabulary/TopicFilter.tsx`, `src/components/vocabulary/TopicFilter.module.css`, `src/components/vocabulary/FlashCard.tsx`, `src/components/vocabulary/FlashCard.module.css`, `src/components/vocabulary/SessionComplete.tsx`, `src/components/vocabulary/SessionComplete.module.css`
- **Dependencies**: TASK-005, TASK-007
- **Acceptance Criteria**: The mode displays due card count and new card count in a summary bar. Topic filter chips are shown (17 topics); today's schedule topics are pre-selected. Cards present French word with audio (TTS). "Show Answer" reveals English translation, example sentences, and replay button. Rating buttons (Again, Hard, Good, Easy) update FSRS state and persist to IndexedDB. New cards are initialised with FSRS defaults on first encounter. Voice input allows speaking the French word with accent-flexible matching. Session complete screen shows counts when all cards are done.
- **Complexity**: L
- **Notes**: Implements REQ-004, REQ-005, REQ-013. The card flip should animate within 100ms (REQ-NFR-001). Wrap in ErrorBoundary.

### TASK-009: Conversation practice mode
- **Component**: ConversationMode, ScaffoldingSelector, MessageList, MessageBubble, ConversationControls, AssessmentCard
- **Files**: `src/components/conversation/ConversationMode.tsx`, `src/components/conversation/ConversationMode.module.css`, `src/components/conversation/ScaffoldingSelector.tsx`, `src/components/conversation/ScaffoldingSelector.module.css`, `src/components/conversation/MessageList.tsx`, `src/components/conversation/MessageList.module.css`, `src/components/conversation/MessageBubble.tsx`, `src/components/conversation/MessageBubble.module.css`, `src/components/conversation/ConversationControls.tsx`, `src/components/conversation/AssessmentCard.tsx`, `src/components/conversation/AssessmentCard.module.css`
- **Dependencies**: TASK-005, TASK-007
- **Acceptance Criteria**: The mode shows a conversation starter for today's topic. User speaks via VoiceInput; transcript is sent to Claude with the system prompt from REQ-007. Claude's streaming response is displayed token by token, then spoken aloud via TTS. Message history (up to 20 turns) is maintained across exchanges. Scaffolding selector offers High/Medium/Low with phase-appropriate defaults. Each level modifies the system prompt per REQ-014. "End Conversation" triggers an assessment API call. Session summary (topic, duration, word count, assessment) is saved to IndexedDB.
- **Complexity**: L
- **Notes**: Implements REQ-006, REQ-014. User messages are right-aligned, assistant messages left-aligned. Wrap in ErrorBoundary.

### TASK-010: Exam simulation mode
- **Component**: ExamMode, ExamTaskList, ExamSession, scenario UIs (8 types), ExamScoreCard, FullMockExam
- **Files**: `src/components/exam/ExamMode.tsx`, `src/components/exam/ExamMode.module.css`, `src/components/exam/ExamTaskList.tsx`, `src/components/exam/ExamTaskList.module.css`, `src/components/exam/ExamSession.tsx`, `src/components/exam/ExamSession.module.css`, `src/components/exam/ExamScoreCard.tsx`, `src/components/exam/ExamScoreCard.module.css`, `src/components/exam/FullMockExam.tsx`, `src/components/exam/scenarios/GuidedInterviewUI.tsx`, `src/components/exam/scenarios/ImageDescriptionUI.tsx`, `src/components/exam/scenarios/RolePlayUI.tsx`, `src/components/exam/scenarios/OpenDiscussionUI.tsx`, `src/components/exam/scenarios/SequentialImagesUI.tsx`, `src/components/exam/scenarios/ListeningComprehensionUI.tsx`, `src/components/exam/scenarios/FormFillingUI.tsx`, `src/components/exam/scenarios/LetterWritingUI.tsx`, `src/components/exam/scenarios/scenarios.module.css`
- **Dependencies**: TASK-005, TASK-007
- **Acceptance Criteria**: Task list groups scenarios under "Oral" and "Written" headings. Selecting a task loads the scenario JSON and configures Claude's system prompt. Each of the 8 scenario types renders its specific UI per REQ-008: guided interview (Q&A turns), image description (text prompt card), role-play (Claude in character), open discussion (topic-guided conversation), sequential images (text cards for each image), listening comprehension (TTS passage + multiple-choice questions), form filling (rendered form with typed fields), letter writing (situation + textarea). Exam scoring calls Claude per REQ-009 with category-specific criteria. Scores display as percentage with category breakdown. Results persist to IndexedDB. Full mock exam option uses ExamTimer with 40-min (oral) or 60-min (written) limits per REQ-015.
- **Complexity**: L
- **Notes**: Implements REQ-008, REQ-009, REQ-015. This is the largest task; the 8 scenario UIs share a common ExamSession wrapper. Wrap in ErrorBoundary.

### TASK-011: Progress dashboard
- **Component**: DashboardMode, ReadinessGauge, ScheduleView, ActivityItem, VocabCoverageChart, ConversationStats, ExamScoresChart, ExportButton
- **Files**: `src/components/dashboard/DashboardMode.tsx`, `src/components/dashboard/DashboardMode.module.css`, `src/components/dashboard/ReadinessGauge.tsx`, `src/components/dashboard/ReadinessGauge.module.css`, `src/components/dashboard/ScheduleView.tsx`, `src/components/dashboard/ScheduleView.module.css`, `src/components/dashboard/ActivityItem.tsx`, `src/components/dashboard/VocabCoverageChart.tsx`, `src/components/dashboard/VocabCoverageChart.module.css`, `src/components/dashboard/ConversationStats.tsx`, `src/components/dashboard/ConversationStats.module.css`, `src/components/dashboard/ExamScoresChart.tsx`, `src/components/dashboard/ExamScoresChart.module.css`, `src/components/dashboard/ExportButton.tsx`
- **Dependencies**: TASK-007
- **Acceptance Criteria**: Dashboard displays vocabulary coverage (learned/total), study streak (consecutive days), and today's schedule with completion checkmarks. Topic breakdown shows per-topic percentage as horizontal bars. Conversation stats show session count, average duration, and 14-day trend line (MiniLineChart). Exam scores show average per task type and a line chart of last 10 results. Readiness estimate is computed as (0.4 * vocab_coverage + 0.3 * norm_exam_score + 0.3 * conversation_freq) * 100. Empty metrics show "No data yet" with zero value. Clicking a schedule activity navigates to the corresponding mode. Activities can be marked complete. Export button downloads all IndexedDB data as JSON.
- **Complexity**: L
- **Notes**: Implements REQ-003, REQ-010, REQ-016. The schedule view calculates the current study day using dateUtils. Handles pre-start, in-progress, and post-exam states. Wrap in ErrorBoundary.

### TASK-012: Integration and polish
- **Component**: All
- **Files**: Various (cross-cutting)
- **Dependencies**: TASK-008, TASK-009, TASK-010, TASK-011
- **Acceptance Criteria**: All four modes are accessible via the sidebar and render correctly. Navigation between modes preserves state within a session. Error boundaries catch and display errors per mode without crashing the app. The browser compatibility warning displays on non-Chrome/Edge browsers. Content area respects max-width of 1200px and centres on viewports above 1440px. Page navigation completes within 200ms. Card flip animates within 100ms. The app functions correctly end-to-end: enter API key, review vocabulary cards, hold a conversation, run an exam scenario, view dashboard metrics.
- **Complexity**: M
- **Notes**: Implements REQ-NFR-001, REQ-NFR-002, REQ-NFR-003. This task covers integration testing, visual polish, and any remaining cross-cutting concerns.

## Dependency Graph

```
TASK-001 (scaffolding)
  +-- TASK-002 (curriculum data)
  +-- TASK-003 (app shell, routing, settings)
  +-- TASK-004 (service layer)
  |     +-- TASK-005 (shared components)
  |     +-- TASK-007 (custom hooks)
  |           +-- TASK-008 (vocabulary mode)
  |           +-- TASK-009 (conversation mode)
  |           +-- TASK-010 (exam mode)
  |           +-- TASK-011 (dashboard)
  +-- TASK-006 (utilities)
        +-- TASK-007 (custom hooks)
TASK-008 + TASK-009 + TASK-010 + TASK-011
  +-- TASK-012 (integration and polish)
```
