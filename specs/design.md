# Design: french-tutor

## Architecture Overview

The application is a single-page application (SPA) running entirely in the browser. There is no backend server. The architecture has four layers:

1. **UI Layer**: React components organised by mode (Vocabulary, Conversation, Exam, Dashboard) plus shared layout components (Sidebar, Settings). Each mode is a top-level route rendered in the main content area.
2. **Service Layer**: Shared modules wrapping external browser APIs and libraries. Three services: ClaudeService (Anthropic SDK wrapper), SpeechService (Web Speech API wrapper), and DatabaseService (IndexedDB wrapper). These are singletons accessed via React context.
3. **Data Layer**: IndexedDB for persistent user state. Bundled JSON files for curriculum data (read-only, imported at build time).
4. **Scheduling Layer**: ts-fsrs library for SRS card scheduling. Operates on card state objects stored in IndexedDB.

```
+----------------------------------------------------------+
|                       App Shell                          |
|  +----------+  +--------------------------------------+  |
|  |          |  |           Main Content               |  |
|  | Sidebar  |  |  +--------------------------------+  |  |
|  | Nav      |  |  | VocabularyMode                 |  |  |
|  |          |  |  | ConversationMode               |  |  |
|  |          |  |  | ExamMode                       |  |  |
|  |          |  |  | DashboardMode                  |  |  |
|  |          |  |  | SettingsPage                   |  |  |
|  |          |  |  +--------------------------------+  |  |
|  +----------+  +--------------------------------------+  |
+----------------------------------------------------------+
|                    Service Layer                          |
|  ClaudeService  |  SpeechService  |  DatabaseService     |
+----------------------------------------------------------+
|                    Data Layer                             |
|  IndexedDB (cards, conversations, examResults, schedule) |
|  Bundled JSON (schedule, vocabulary, scenarios)          |
+----------------------------------------------------------+
```

Data flow is unidirectional: user actions trigger service calls, services update IndexedDB, components re-read from IndexedDB (or from service return values) and re-render. Claude API calls flow from components through ClaudeService; speech I/O flows through SpeechService.

Each mode component is wrapped in a React error boundary. A crashed mode does not take down the entire application.

## Technology Decisions

- **Language**: TypeScript 5.x (strict mode)
- **Framework**: React 18 with functional components and hooks
- **Build Tool**: Vite 5.x (fast HMR, native ESM, TypeScript support)
- **Package Manager**: npm
- **Test Framework**: Vitest (Vite-native, Jest-compatible API)
- **Linter**: ESLint with @typescript-eslint
- **Styling**: CSS Modules (co-located .module.css files per component)
- **SRS Library**: ts-fsrs (TypeScript FSRS implementation)
- **API Client**: @anthropic-ai/sdk (official Anthropic TypeScript SDK)
- **Routing**: React Router v6 (client-side routing for mode navigation)
- **Charts**: Lightweight inline SVG charts (no charting library; the dashboard has only two simple charts)
- **Rationale**: React + Vite + TypeScript is the standard SPA stack. CSS Modules avoid global style collisions without adding a CSS-in-JS runtime. ts-fsrs is the canonical FSRS implementation for TypeScript. The Anthropic SDK handles streaming, retries, and type safety. React Router provides declarative routing. No charting library is needed because the two dashboard charts (line chart of sessions, line chart of exam scores) are simple enough to render as SVG paths.

## Component Hierarchy

```
App
├── ErrorBoundary (app-level, catches routing/context errors)
├── ServiceProviders (ClaudeService, SpeechService, DatabaseService contexts)
│   └── Router
│       ├── AppShell
│       │   ├── Sidebar
│       │   │   ├── NavItem (Vocabulary)
│       │   │   ├── NavItem (Conversation)
│       │   │   ├── NavItem (Exam)
│       │   │   ├── NavItem (Dashboard)
│       │   │   └── SettingsButton
│       │   └── MainContent (outlet)
│       │       ├── Route: /vocabulary → ErrorBoundary → VocabularyMode
│       │       │   ├── VocabSummaryBar
│       │       │   ├── TopicFilter
│       │       │   ├── FlashCard
│       │       │   │   ├── CardFront (French word + audio)
│       │       │   │   └── CardBack (English, example, audio, rating buttons)
│       │       │   ├── VoiceInput
│       │       │   └── SessionComplete
│       │       ├── Route: /conversation → ErrorBoundary → ConversationMode
│       │       │   ├── ScaffoldingSelector
│       │       │   ├── MessageList
│       │       │   │   └── MessageBubble (user or assistant)
│       │       │   ├── VoiceInput
│       │       │   ├── ConversationControls (end, new topic)
│       │       │   └── AssessmentCard
│       │       ├── Route: /exam → ErrorBoundary → ExamMode
│       │       │   ├── ExamTaskList (grouped by oral/written)
│       │       │   ├── ExamTimer
│       │       │   ├── ExamSession (renders scenario-specific UI)
│       │       │   │   ├── GuidedInterviewUI (self-introduction)
│       │       │   │   ├── ImageDescriptionUI
│       │       │   │   ├── RolePlayUI
│       │       │   │   ├── OpenDiscussionUI
│       │       │   │   ├── SequentialImagesUI
│       │       │   │   ├── ListeningComprehensionUI
│       │       │   │   ├── FormFillingUI
│       │       │   │   └── LetterWritingUI
│       │       │   └── ExamScoreCard
│       │       ├── Route: /dashboard → ErrorBoundary → DashboardMode
│       │       │   ├── ReadinessGauge
│       │       │   ├── ScheduleView
│       │       │   │   └── ActivityItem
│       │       │   ├── VocabCoverageChart
│       │       │   ├── ConversationStats
│       │       │   │   └── MiniLineChart
│       │       │   ├── ExamScoresChart
│       │       │   │   └── MiniLineChart
│       │       │   └── ExportButton
│       │       └── Route: /settings → SettingsPage
│       │           └── ApiKeyForm
│       └── Route: / → Redirect to /dashboard (if key exists) or /settings (if not)
```

### Shared Components

- **VoiceInput**: Microphone button + transcript display. Used by VocabularyMode, ConversationMode, and oral exam UIs. Props: `onTranscript(text: string)`, `lang?: string`, `isListening: boolean`.
- **ErrorBoundary**: Wraps each mode. Displays a "Something went wrong" fallback with a retry button. Logs the error to console.
- **MiniLineChart**: SVG-based line chart. Props: `data: {x: string, y: number}[]`, `width: number`, `height: number`, `color: string`. Used in dashboard for conversation and exam trends.
- **ExamTimer**: Countdown timer with warning state. Props: `durationMinutes: number`, `onExpired: () => void`, `active: boolean`.

## Components

### ClaudeService
- **Responsibility**: Wraps the @anthropic-ai/sdk Anthropic client. Provides a single method for sending messages with streaming. Handles API key retrieval from localStorage, error mapping to user-friendly messages, and streaming token assembly.
- **Interface**:
  ```typescript
  interface ClaudeService {
    sendMessage(params: {
      systemPrompt: string;
      messages: Array<{role: 'user' | 'assistant'; content: string}>;
      onToken: (token: string) => void;
      onComplete: (fullText: string) => void;
      onError: (error: AppError) => void;
    }): AbortController;
  }

  interface AppError {
    code: 'NO_API_KEY' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'SERVER_ERROR';
    message: string;  // user-friendly
  }
  ```
- **Dependencies**: @anthropic-ai/sdk, localStorage (API key)

### SpeechService
- **Responsibility**: Wraps Web Speech API. Provides speech-to-text (recognition) and text-to-speech (synthesis) with French language configuration. Handles browser compatibility detection, voice selection, and microphone permissions.
- **Interface**:
  ```typescript
  interface SpeechService {
    // STT
    isRecognitionSupported(): boolean;
    startRecognition(params: {
      lang?: string;         // default: 'fr-CH'
      onInterim: (text: string) => void;
      onFinal: (text: string) => void;
      onError: (error: string) => void;
    }): void;
    stopRecognition(): void;

    // TTS
    speak(text: string, options?: {
      lang?: string;         // default: 'fr-FR'
      rate?: number;         // default: 0.9
      onEnd?: () => void;
    }): void;
    stopSpeaking(): void;
    isSpeaking(): boolean;

    // Capability
    getMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'>;
  }
  ```
- **Dependencies**: window.SpeechRecognition (or webkitSpeechRecognition), window.speechSynthesis

### DatabaseService
- **Responsibility**: Wraps IndexedDB. Provides typed CRUD operations for each object store. Handles database versioning and migration. All methods return Promises.
- **Interface**:
  ```typescript
  interface DatabaseService {
    // Cards
    getCard(wordId: string): Promise<CardState | undefined>;
    getAllCards(): Promise<CardState[]>;
    getCardsDueForReview(now: Date): Promise<CardState[]>;
    getNewCards(topic?: string): Promise<CardState[]>;
    saveCard(card: CardState): Promise<void>;

    // Conversations
    saveConversation(session: ConversationSession): Promise<void>;
    getConversations(limit?: number): Promise<ConversationSession[]>;
    getConversationStats(): Promise<ConversationStats>;

    // Exam Results
    saveExamResult(result: ExamResult): Promise<void>;
    getExamResults(taskType?: string, limit?: number): Promise<ExamResult[]>;

    // Schedule Progress
    markActivityComplete(day: number, activityIndex: number): Promise<void>;
    getScheduleProgress(): Promise<ScheduleProgress[]>;
    isActivityComplete(day: number, activityIndex: number): Promise<boolean>;

    // Export
    exportAll(): Promise<ExportData>;
  }
  ```
- **Dependencies**: window.indexedDB

## Data Model

### IndexedDB Database: "french-tutor-db"

**Version**: 1

### Object Stores

#### cards
- **Key path**: `wordId` (string, matches vocabulary.json word id)
- **Indexes**: `topic` (non-unique), `due` (non-unique, Date), `state` (non-unique, FSRS State enum)

| Field | Type | Description |
|---|---|---|
| wordId | string | Primary key, matches vocabulary.json id field |
| due | Date | Next review date (from FSRS) |
| stability | number | FSRS stability parameter |
| difficulty | number | FSRS difficulty parameter |
| elapsed_days | number | Days since last review |
| scheduled_days | number | Scheduled interval in days |
| reps | number | Total successful repetitions |
| lapses | number | Total lapses (forgotten count) |
| state | number | FSRS card state (0=New, 1=Learning, 2=Review, 3=Relearning) |
| last_review | Date | null | Timestamp of last review |
| topic | string | Topic from vocabulary.json for filtering |

#### conversations
- **Key path**: auto-increment
- **Indexes**: `timestamp` (non-unique, Date)

| Field | Type | Description |
|---|---|---|
| id | number | Auto-incremented primary key |
| topic | string | Conversation topic label |
| duration | number | Session duration in seconds |
| userWordCount | number | Count of words the user spoke |
| assessment | string | Claude's assessment text |
| timestamp | Date | When the session ended |

#### examResults
- **Key path**: auto-increment
- **Indexes**: `taskType` (non-unique), `timestamp` (non-unique, Date), `scenarioId` (non-unique)

| Field | Type | Description |
|---|---|---|
| id | number | Auto-incremented primary key |
| scenarioId | string | ID from scenario JSON (e.g., "pharmacy", "market") |
| taskType | string | "oral" or "written" |
| scores | object | Category-keyed scores, e.g., `{completeness: 18, vocabulary: 15, ...}` |
| totalPercent | number | Overall percentage (0-100) |
| timestamp | Date | When the exam was scored |

#### scheduleProgress
- **Key path**: compound key `[day, activityIndex]`
- **Indexes**: `day` (non-unique)

| Field | Type | Description |
|---|---|---|
| day | number | Study day number (1-23) |
| activityIndex | number | Index of activity within that day's activities array |
| completed | boolean | Whether the activity has been completed |
| completedAt | Date | null | Timestamp of completion |

### Bundled Data (read-only, imported at build time)

These TypeScript modules re-export the JSON data with type annotations:

#### src/data/schedule.ts
Exports the schedule.json content typed as:
```typescript
interface Schedule {
  version: string;
  exam_date: string;        // ISO date
  start_date: string;       // ISO date
  total_days: number;
  weekends_off: boolean;
  phases: Phase[];
  days: StudyDay[];
}

interface Phase {
  name: string;
  days: [number, number];   // [start_day, end_day]
  focus: string;
  daily_time_minutes: number;
}

interface StudyDay {
  day: number;
  date: string;
  weekday: string;
  phase: string;
  title: string;
  activities: Activity[];
  grammar_focus: string;
  topics: string[];
}

interface Activity {
  mode: 'vocabulary' | 'conversation' | 'exam' | 'dashboard';
  task: string;
  minutes: number;
  new_words?: number;
}
```

#### src/data/vocabulary.ts
Exports the vocabulary.json content typed as:
```typescript
interface VocabularyData {
  version: string;
  metadata: {
    total_words: number;
    levels: Record<string, number>;
    topics: string[];
  };
  words: VocabWord[];
}

interface VocabWord {
  id: string;
  french: string;
  english: string;
  example_fr: string;
  example_en: string;
  topic: string;
  level: 'A1' | 'A2';
  pos: string;
  gender: string | null;
}
```

#### src/data/scenarios.ts
Exports all scenario JSON files as a typed map:
```typescript
type ScenarioMap = Record<string, ScenarioDefinition>;

interface ScenarioDefinition {
  id: string;
  type: string;
  exam_section: string;
  level: string;
  title: string;
  description: string;
  duration_minutes: number;
  system_prompt?: string;
  system_prompt_template?: string;
  // Type-specific fields vary by scenario type.
  // Each scenario type has its own sub-interface.
  [key: string]: unknown;
}
```

### Migration Strategy

IndexedDB schema changes are handled via the `onupgradeneeded` event. The version number in the database open call controls migrations. Each version increment adds a migration function that creates or modifies object stores without deleting existing data. The pattern:

```typescript
const DB_VERSION = 1;

function onUpgrade(db: IDBDatabase, oldVersion: number) {
  if (oldVersion < 1) {
    // Version 1: initial schema
    const cards = db.createObjectStore('cards', { keyPath: 'wordId' });
    cards.createIndex('topic', 'topic');
    cards.createIndex('due', 'due');
    cards.createIndex('state', 'state');

    const convos = db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true });
    convos.createIndex('timestamp', 'timestamp');

    const exams = db.createObjectStore('examResults', { keyPath: 'id', autoIncrement: true });
    exams.createIndex('taskType', 'taskType');
    exams.createIndex('timestamp', 'timestamp');
    exams.createIndex('scenarioId', 'scenarioId');

    const progress = db.createObjectStore('scheduleProgress', { keyPath: ['day', 'activityIndex'] });
    progress.createIndex('day', 'day');
  }
  // Future migrations: if (oldVersion < 2) { ... }
}
```

## State Management

React hooks and context. No external state management library.

### Contexts

1. **ClaudeContext**: Provides the ClaudeService instance. Created once at app root.
2. **SpeechContext**: Provides the SpeechService instance. Created once at app root.
3. **DatabaseContext**: Provides the DatabaseService instance. Created once at app root after IndexedDB initialisation.

### Custom Hooks

- `useCards(topic?: string)`: Returns cards due, new cards, and mutation functions. Reads from DatabaseService.
- `useFSRS()`: Returns a configured FSRS instance from ts-fsrs for scheduling calculations.
- `useConversation()`: Manages conversation state (messages array, streaming status, assessment). Calls ClaudeService.
- `useExamSession(scenarioId: string)`: Manages exam session state (scenario config, turns, scoring). Calls ClaudeService.
- `useSchedule()`: Returns current study day, activities, and completion status. Reads from schedule data and DatabaseService.
- `useSpeech()`: Convenience hook that returns both STT and TTS functions from SpeechContext.
- `useVoiceInput()`: Manages voice input state (isListening, interim text, final text). Composes useSpeech.

## CSS Architecture

### Methodology

CSS Modules with co-located stylesheets. Each component has a `.module.css` file in the same directory. Class names are locally scoped by default, preventing collisions.

### File Structure

```
src/
├── styles/
│   ├── variables.css       # CSS custom properties (colours, spacing, typography)
│   ├── reset.css           # Minimal CSS reset (box-sizing, margins)
│   └── global.css          # Body font, background, scrollbar styling
├── components/
│   ├── Sidebar/
│   │   ├── Sidebar.tsx
│   │   └── Sidebar.module.css
│   ├── FlashCard/
│   │   ├── FlashCard.tsx
│   │   └── FlashCard.module.css
│   └── ...
```

### Design Tokens (CSS Custom Properties)

Design tokens are defined as CSS custom properties in `variables.css`.

| Token group | Variables | Values |
|---|---|---|
| Primary colours | color-primary, color-primary-light, color-primary-dark | #2563eb, #3b82f6, #1d4ed8 |
| Semantic colours | color-success, color-error, color-warning | #16a34a (green), #dc2626 (red), #d97706 (amber) |
| Surface colours | color-bg, color-surface, color-surface-hover, color-border | #fafafa, #ffffff, #f3f4f6, #e5e7eb |
| Text colours | color-text, color-text-secondary, color-text-muted | #1f2937, #6b7280, #9ca3af |
| Sidebar | sidebar-width, sidebar-width-collapsed, sidebar-bg, sidebar-text, sidebar-active | 240px, 64px, #1e293b, #e2e8f0, primary |
| Typography | font-family, font-mono, font-size-xs through font-size-3xl | Inter + system fallbacks; 0.75rem to 1.875rem |
| Spacing | space-1 through space-12 | 4px base scale: 0.25rem to 3rem |
| Layout | content-max-width, border-radius, border-radius-lg | 1200px, 8px, 12px |
| Transitions | transition-fast, transition-normal | 100ms ease, 200ms ease |
| Shadows | shadow-sm, shadow-md, shadow-lg | Increasing blur and opacity |

All variables are prefixed with `--` following CSS custom property convention (e.g. `--color-primary`).

### Responsive Breakpoints

```css
/* Sidebar collapse */
@media (max-width: 768px) {
  :root {
    --sidebar-width: var(--sidebar-width-collapsed);
  }
}

/* Content max-width kicks in */
@media (min-width: 1440px) {
  /* Content area centres with max-width */
}
```

### Component Styling Patterns

- **Cards**: White background, subtle shadow, rounded corners. Used for flashcards, exam scenarios, assessment results.
- **Buttons**: Primary (blue filled), Secondary (grey outline), Danger (red filled for destructive actions). Consistent padding and border-radius.
- **Chips**: Small rounded pills for topic filters. Active state uses primary colour fill, inactive uses border only.
- **Message bubbles**: User messages right-aligned with primary-light background. Assistant messages left-aligned with surface background.
- **Progress bars**: Horizontal bars with rounded ends. Filled portion uses primary colour. Topic coverage bars use a lighter shade.
- **Timer**: Monospace font, large size. Warning state uses error colour with CSS animation (pulse).

## Build Configuration

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
```

### Project Structure

```
french-tutor/
├── src/
│   ├── main.tsx                    # Entry point, renders App
│   ├── App.tsx                     # Router setup, context providers
│   ├── styles/
│   │   ├── variables.css
│   │   ├── reset.css
│   │   └── global.css
│   ├── data/
│   │   ├── schedule.ts             # Re-exports schedule.json with types
│   │   ├── vocabulary.ts           # Re-exports vocabulary.json with types
│   │   └── scenarios.ts            # Re-exports all scenario JSONs with types
│   ├── services/
│   │   ├── claude.ts               # ClaudeService implementation
│   │   ├── speech.ts               # SpeechService implementation
│   │   ├── database.ts             # DatabaseService implementation (IndexedDB)
│   │   └── types.ts                # Shared service types (AppError, etc.)
│   ├── hooks/
│   │   ├── useCards.ts
│   │   ├── useFSRS.ts
│   │   ├── useConversation.ts
│   │   ├── useExamSession.ts
│   │   ├── useSchedule.ts
│   │   ├── useSpeech.ts
│   │   └── useVoiceInput.ts
│   ├── contexts/
│   │   ├── ClaudeContext.tsx
│   │   ├── SpeechContext.tsx
│   │   └── DatabaseContext.tsx
│   ├── components/
│   │   ├── shared/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── VoiceInput.module.css
│   │   │   ├── MiniLineChart.tsx
│   │   │   ├── MiniLineChart.module.css
│   │   │   ├── ExamTimer.tsx
│   │   │   └── ExamTimer.module.css
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── AppShell.module.css
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.module.css
│   │   ├── vocabulary/
│   │   │   ├── VocabularyMode.tsx
│   │   │   ├── VocabularyMode.module.css
│   │   │   ├── VocabSummaryBar.tsx
│   │   │   ├── VocabSummaryBar.module.css
│   │   │   ├── TopicFilter.tsx
│   │   │   ├── TopicFilter.module.css
│   │   │   ├── FlashCard.tsx
│   │   │   ├── FlashCard.module.css
│   │   │   ├── SessionComplete.tsx
│   │   │   └── SessionComplete.module.css
│   │   ├── conversation/
│   │   │   ├── ConversationMode.tsx
│   │   │   ├── ConversationMode.module.css
│   │   │   ├── ScaffoldingSelector.tsx
│   │   │   ├── ScaffoldingSelector.module.css
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageList.module.css
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageBubble.module.css
│   │   │   ├── ConversationControls.tsx
│   │   │   ├── AssessmentCard.tsx
│   │   │   └── AssessmentCard.module.css
│   │   ├── exam/
│   │   │   ├── ExamMode.tsx
│   │   │   ├── ExamMode.module.css
│   │   │   ├── ExamTaskList.tsx
│   │   │   ├── ExamTaskList.module.css
│   │   │   ├── ExamSession.tsx
│   │   │   ├── ExamSession.module.css
│   │   │   ├── ExamScoreCard.tsx
│   │   │   ├── ExamScoreCard.module.css
│   │   │   ├── scenarios/
│   │   │   │   ├── GuidedInterviewUI.tsx
│   │   │   │   ├── ImageDescriptionUI.tsx
│   │   │   │   ├── RolePlayUI.tsx
│   │   │   │   ├── OpenDiscussionUI.tsx
│   │   │   │   ├── SequentialImagesUI.tsx
│   │   │   │   ├── ListeningComprehensionUI.tsx
│   │   │   │   ├── FormFillingUI.tsx
│   │   │   │   ├── LetterWritingUI.tsx
│   │   │   │   └── scenarios.module.css
│   │   │   └── FullMockExam.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardMode.tsx
│   │   │   ├── DashboardMode.module.css
│   │   │   ├── ReadinessGauge.tsx
│   │   │   ├── ReadinessGauge.module.css
│   │   │   ├── ScheduleView.tsx
│   │   │   ├── ScheduleView.module.css
│   │   │   ├── ActivityItem.tsx
│   │   │   ├── VocabCoverageChart.tsx
│   │   │   ├── VocabCoverageChart.module.css
│   │   │   ├── ConversationStats.tsx
│   │   │   ├── ConversationStats.module.css
│   │   │   ├── ExamScoresChart.tsx
│   │   │   ├── ExamScoresChart.module.css
│   │   │   └── ExportButton.tsx
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       ├── SettingsPage.module.css
│   │       ├── ApiKeyForm.tsx
│   │       └── ApiKeyForm.module.css
│   └── utils/
│       ├── dateUtils.ts            # Study day calculation, weekend skipping
│       ├── textMatch.ts            # Accent-flexible string comparison
│       └── formatters.ts           # Duration, percentage, date formatting
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
└── README.md
```

## Data Flow Specification

### Dashboard Readiness Estimate

| Metric | Source | Computation |
|---|---|---|
| vocabulary_coverage | IndexedDB `cards` store | count(cards where reps > 0) / vocabulary.json metadata.total_words |
| normalised_avg_exam_score | IndexedDB `examResults` store | mean(totalPercent) / 100, or 0 if no results |
| conversation_frequency_score | IndexedDB `conversations` store | min(1.0, count(sessions where timestamp > 7 days ago) / 7) |
| readiness_percent | Derived | (0.4 * vocabulary_coverage + 0.3 * normalised_avg_exam_score + 0.3 * conversation_frequency_score) * 100 |

### Vocabulary Card Lifecycle

```
vocabulary.json word → (first review) → new CardState in IndexedDB
  → user rates (Again/Hard/Good/Easy)
  → ts-fsrs.repeat(card, rating) → updated CardState
  → saved to IndexedDB cards store
  → next due date determines when card appears again
```

### Conversation Session Flow

```
User speaks → SpeechService.startRecognition → transcript
  → ClaudeService.sendMessage(systemPrompt, history + transcript)
  → streaming tokens → display + accumulate
  → full response → SpeechService.speak(response)
  → repeat until "End Conversation"
  → final assessment API call → save to IndexedDB conversations store
```

### Exam Task Flow

```
User selects scenario → load scenario JSON → configure system prompt
  → Claude interaction (scenario-specific UI) → user completes task
  → scoring API call (system prompt with scoring criteria)
  → parse scores → display ExamScoreCard → save to IndexedDB examResults store
```

## Traceability Matrix

| Requirement | Design Component | Task |
|---|---|---|
| REQ-001 | SettingsPage, ApiKeyForm, localStorage | TASK-003, TASK-004 |
| REQ-002 | AppShell, Sidebar, NavItem, React Router | TASK-003, TASK-005 |
| REQ-003 | DashboardMode, ScheduleView, ActivityItem, useSchedule, dateUtils | TASK-012, TASK-013 |
| REQ-004 | VocabularyMode, FlashCard, VocabSummaryBar, useCards, useFSRS, DatabaseService | TASK-008, TASK-009 |
| REQ-005 | VoiceInput, useVoiceInput, SpeechService, textMatch | TASK-006, TASK-009 |
| REQ-006 | ConversationMode, MessageList, MessageBubble, ConversationControls, AssessmentCard, useConversation, ClaudeService | TASK-007, TASK-010 |
| REQ-007 | ClaudeService, ClaudeContext | TASK-004 |
| REQ-008 | ExamMode, ExamTaskList, ExamSession, scenario UIs (8 types), useExamSession | TASK-011 |
| REQ-009 | ExamScoreCard, useExamSession (scoring logic), ClaudeService | TASK-011 |
| REQ-010 | DashboardMode, ReadinessGauge, VocabCoverageChart, ConversationStats, ExamScoresChart, MiniLineChart | TASK-012, TASK-013 |
| REQ-011 | SpeechService, SpeechContext, VoiceInput | TASK-006 |
| REQ-012 | DatabaseService, DatabaseContext, IndexedDB schema | TASK-004 |
| REQ-013 | TopicFilter, useCards (topic filtering) | TASK-009 |
| REQ-014 | ScaffoldingSelector, useConversation (prompt modification) | TASK-010 |
| REQ-015 | ExamTimer, FullMockExam | TASK-011 |
| REQ-016 | ExportButton, DatabaseService.exportAll() | TASK-013 |
| REQ-NFR-001 | Vite build optimisation, React lazy loading (not needed at this scale), CSS transitions | TASK-002 |
| REQ-NFR-002 | Browser detection in App.tsx, compatibility warning banner | TASK-003 |
| REQ-NFR-003 | CSS variables for sidebar width, media queries, max-width constraint | TASK-005 |
