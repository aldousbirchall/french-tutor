# Requirements: french-tutor

## Overview

A browser-only SPA for preparing for the Swiss Fide French exam (A1 written, A2 oral). Four modes: vocabulary drill with spaced repetition (FSRS), Claude-powered conversation practice, Fide exam simulation, and a progress dashboard. All state persisted locally in IndexedDB. Voice interaction via Web Speech API. No backend server. Curriculum data bundled at build time from JSON files.

## Requirements

### REQ-001: Settings and API Key Management
- **Priority**: Must
- **Type**: Functional
- **Statement**: WHEN the user first opens the app THE system SHALL display a settings page to enter their Anthropic API key
- **Acceptance Criteria**:
  1. GIVEN no API key stored WHEN the app loads THEN the settings page is displayed
  2. GIVEN the settings page WHEN the user enters a valid API key and submits THEN the key is stored in localStorage and the app navigates to the main view
  3. GIVEN any page WHEN the user clicks the settings icon in the sidebar THEN the settings page is displayed with the current key masked (showing only last 4 characters)
  4. GIVEN the settings page WHEN the user clears the key and submits THEN the key is removed from localStorage
- **Dependencies**: None

### REQ-002: Navigation and Layout
- **Priority**: Must
- **Type**: Functional
- **Statement**: THE system SHALL provide a sidebar navigation with four modes: Vocabulary, Conversation, Exam, and Dashboard
- **Acceptance Criteria**:
  1. GIVEN the app WHEN loaded with a valid API key THEN a sidebar is visible with icons and labels for Vocabulary, Conversation, Exam, and Dashboard
  2. GIVEN the sidebar WHEN the user clicks a mode THEN the main content area displays that mode's view
  3. GIVEN any mode WHEN it is the active route THEN its sidebar entry has a visually distinct highlight (background colour change)
  4. GIVEN a viewport width below 768px WHEN rendered THEN the sidebar collapses to show icons only (no labels)
  5. GIVEN the sidebar WHEN rendered THEN the settings icon is positioned at the bottom of the sidebar, visually separated from mode entries
- **Dependencies**: REQ-001

### REQ-003: Study Schedule Display
- **Priority**: Must
- **Type**: Functional
- **Statement**: THE system SHALL display the current day's study plan based on the embedded schedule data
- **Acceptance Criteria**:
  1. GIVEN the dashboard WHEN loaded THEN the current study day is calculated from schedule.json start_date and today's date, skipping Saturdays and Sundays
  2. GIVEN a valid study day WHEN displayed THEN the view shows the day title, phase name, list of activities with time estimates in minutes, and grammar focus text
  3. GIVEN an activity item WHEN the user clicks it THEN the app navigates to the corresponding mode (vocabulary, conversation, or exam)
  4. GIVEN a completed activity WHEN the user marks it done THEN its completion status is persisted in IndexedDB and the activity shows a completed indicator (checkmark)
  5. GIVEN a date before start_date or after exam_date WHEN the dashboard loads THEN a message indicates the study period has not started or has ended
  6. GIVEN a weekend date WHEN the dashboard loads THEN the app shows the most recent weekday's schedule with an indicator that today is a rest day
- **Dependencies**: REQ-012

### REQ-004: Vocabulary Drill Mode (SRS)
- **Priority**: Must
- **Type**: Functional
- **Statement**: THE system SHALL implement a spaced repetition vocabulary drill using the FSRS algorithm via the ts-fsrs library
- **Acceptance Criteria**:
  1. GIVEN the vocabulary mode WHEN loaded THEN a summary bar shows the count of cards due for review and the count of new cards available today
  2. GIVEN a review session WHEN started THEN cards due for review are presented first, followed by new cards up to a daily limit of 25
  3. GIVEN a card WHEN presented THEN the French word is displayed and spoken aloud via SpeechSynthesis
  4. GIVEN a displayed card WHEN the user clicks "Show Answer" THEN the English translation, example sentence (French and English), and a replay audio button are shown
  5. GIVEN a revealed card WHEN the user selects a difficulty rating (Again, Hard, Good, Easy) THEN the FSRS scheduling parameters are recalculated using ts-fsrs and the updated card state is saved to IndexedDB
  6. GIVEN a new card WHEN first encountered THEN it is initialised with FSRS default parameters (stability, difficulty, elapsed_days, scheduled_days, reps, lapses all at initial values)
  7. GIVEN the vocabulary mode WHEN all due and new cards are exhausted THEN a "session complete" summary is shown with counts of cards reviewed and new cards learned
- **Dependencies**: REQ-012

### REQ-005: Vocabulary Voice Production
- **Priority**: Must
- **Type**: Functional
- **Statement**: WHEN in vocabulary drill mode THE system SHALL support voice input for the user to speak the French word
- **Acceptance Criteria**:
  1. GIVEN a card showing the English translation WHEN the user presses the microphone button or the spacebar THEN Web Speech API recognition starts with lang set to "fr-CH" and continuous set to false
  2. GIVEN active recognition WHEN the user speaks THEN interim transcription results are displayed in real time below the card
  3. GIVEN recognition WHEN silence is detected for 1.5 seconds THEN the transcript is finalised and compared to the expected French word
  4. GIVEN a finalised transcript WHEN it matches the expected word (case-insensitive, ignoring accents via Unicode normalisation NFD with diacritics stripped) THEN a green success indicator is shown
  5. GIVEN a finalised transcript WHEN it does not match THEN the user's attempt is displayed in red alongside the correct word in green
- **Dependencies**: REQ-004, REQ-011

### REQ-006: Conversation Practice Mode
- **Priority**: Must
- **Type**: Functional
- **Statement**: THE system SHALL provide AI-powered French conversation practice using the Claude API
- **Acceptance Criteria**:
  1. GIVEN conversation mode WHEN loaded THEN a conversation starter prompt appropriate to the current study day's topic (from schedule.json) is displayed
  2. GIVEN a conversation WHEN the user speaks via Web Speech API THEN the transcript is sent to Claude with the conversation system prompt
  3. GIVEN Claude's response WHEN tokens arrive via streaming THEN each token is appended to the display and the full response is read aloud via SpeechSynthesis (fr-FR voice) after streaming completes
  4. GIVEN a conversation WHEN ongoing THEN the full message history (up to 20 turns, where one turn is one user message plus one assistant message) is sent with each API call
  5. GIVEN conversation mode WHEN the user clicks "End Conversation" THEN a final API call requests an assessment from Claude covering vocabulary used, grammar accuracy, and fluency, displayed as a summary card
  6. GIVEN a completed conversation WHEN the assessment is received THEN the session summary (topic, duration in seconds, user word count, assessment text) is saved to IndexedDB
- **Dependencies**: REQ-007, REQ-011, REQ-012

### REQ-007: Claude API Integration
- **Priority**: Must
- **Type**: Functional
- **Statement**: THE system SHALL call the Anthropic Messages API directly from the browser using the @anthropic-ai/sdk package with streaming enabled
- **Acceptance Criteria**:
  1. GIVEN an API call WHEN constructed THEN it uses the API key from localStorage and model "claude-sonnet-4-20250514"
  2. GIVEN streaming WHEN enabled THEN response tokens are displayed incrementally as they arrive via the SDK's streaming interface
  3. GIVEN an API error (network failure, 401, 429, 500) WHEN received THEN a user-friendly error message is displayed in a dismissible banner (not the raw error object or stack trace)
  4. GIVEN an API error with status 401 WHEN received THEN the error message suggests checking the API key in settings
  5. GIVEN the Anthropic SDK WHEN initialised THEN dangerouslyAllowBrowser is set to true
  6. GIVEN the conversation system prompt WHEN constructed THEN it includes the text: "You are a French conversation partner. Speak only in French. Use vocabulary and grammar appropriate to CEFR A1-A2 level. Keep sentences short and clear. If the student makes an error, gently correct it in your next response."
- **Dependencies**: REQ-001

### REQ-008: Exam Simulation Mode
- **Priority**: Must
- **Type**: Functional
- **Statement**: THE system SHALL simulate Fide exam tasks using scenario definitions loaded from bundled curriculum data
- **Acceptance Criteria**:
  1. GIVEN exam mode WHEN loaded THEN available exam task types are displayed grouped under "Oral" (self-introduction, image-description, role-play, open-discussion, sequential-images, listening-comprehension) and "Written" (form-filling, letter-writing) headings
  2. GIVEN a selected task type WHEN the user starts it THEN the scenario definition is loaded and the Claude system prompt is configured with the scenario's system_prompt or system_prompt_template (with template variables filled from the selected sub-scenario)
  3. GIVEN a role-play scenario WHEN active THEN Claude plays the specified role, uses the scenario's opening prompt as its first message, and follows the scenario context
  4. GIVEN an image description scenario WHEN active THEN the text description from the scenario's image_prompts array is displayed as a prompt card, and the user is asked to describe the scene
  5. GIVEN a listening comprehension exercise WHEN active THEN the passage text is read aloud via SpeechSynthesis (up to the number of plays specified), followed by questions presented one at a time with multiple-choice options
  6. GIVEN a form-filling exercise WHEN active THEN a form UI is rendered with the fields from the scenario definition (text inputs, date inputs, select dropdowns as specified by each field's type property)
  7. GIVEN a letter-writing exercise WHEN active THEN the situation description and required points are displayed, and a textarea is provided for the user's response
  8. GIVEN any exam task WHEN completed THEN a score and feedback are displayed, and results are saved to IndexedDB
- **Dependencies**: REQ-007, REQ-009, REQ-011, REQ-012

### REQ-009: Exam Scoring
- **Priority**: Must
- **Type**: Functional
- **Statement**: WHEN an exam task is completed THE system SHALL provide scoring aligned with Fide criteria via a Claude API call
- **Acceptance Criteria**:
  1. GIVEN an oral task WHEN completed THEN Claude is asked to score on five categories: task completion (0-20), vocabulary range (0-20), grammar accuracy (0-20), fluency (0-20), and pronunciation (0-20, based on STT match rate during the session)
  2. GIVEN a written task WHEN completed THEN Claude is asked to score on six categories: task completion (0-20), register appropriateness (0-15), structure (0-15), grammar (0-20), vocabulary (0-15), and length appropriateness (0-15)
  3. GIVEN a score WHEN generated THEN it is displayed as a percentage (sum of category scores / max possible * 100) with a breakdown bar showing each category
  4. GIVEN a score WHEN saved to IndexedDB THEN the record includes scenario_id, task_type (oral or written), individual category scores, total percentage, and ISO 8601 timestamp
- **Dependencies**: REQ-007, REQ-012

### REQ-010: Progress Dashboard
- **Priority**: Must
- **Type**: Functional
- **Statement**: THE system SHALL display a progress dashboard with learning metrics computed from IndexedDB data
- **Acceptance Criteria**:
  1. GIVEN the dashboard WHEN loaded THEN it displays: vocabulary coverage (cards with at least one review / total cards in vocabulary.json), study streak (count of consecutive calendar days with at least one activity completed), and today's schedule with per-activity completion status
  2. GIVEN vocabulary data WHEN displayed THEN a topic breakdown shows percentage of cards learned (at least one review) per topic, rendered as a horizontal bar per topic
  3. GIVEN conversation history WHEN displayed THEN total session count, average duration in minutes, and a simple line chart of session count per day over the last 14 days are shown
  4. GIVEN exam results WHEN displayed THEN average score per task type is shown, with a line chart of scores over time (all task types, last 10 results)
  5. GIVEN all metrics WHEN combined THEN an overall exam readiness estimate is displayed as a percentage, computed as: (0.4 * vocabulary_coverage) + (0.3 * normalised_avg_exam_score) + (0.3 * conversation_frequency_score), where conversation_frequency_score = min(1.0, sessions_last_7_days / 7)
  6. GIVEN no data for a metric WHEN the dashboard renders THEN the metric shows "No data yet" with a zero value, not fabricated numbers
- **Dependencies**: REQ-003, REQ-004, REQ-006, REQ-008, REQ-012

### REQ-011: Web Speech API Integration
- **Priority**: Must
- **Type**: Non-Functional
- **Statement**: THE system SHALL use the Web Speech API for speech-to-text (SpeechRecognition) and SpeechSynthesis for text-to-speech
- **Acceptance Criteria**:
  1. GIVEN STT WHEN initialised THEN the language is set to "fr-CH" and continuous is set to false
  2. GIVEN TTS WHEN speaking French text THEN the system selects the best available French voice (preferring voices with lang "fr-CH", falling back to "fr-FR", then any voice with lang starting with "fr")
  3. GIVEN TTS WHEN speaking THEN the rate property is set to 0.9
  4. GIVEN a browser without SpeechRecognition support WHEN the app loads THEN a warning banner is displayed stating that Chrome or Edge is required for speech features
  5. GIVEN microphone permission WHEN not granted or denied THEN a guidance message is displayed explaining how to enable microphone access in browser settings
- **Dependencies**: None

### REQ-012: Data Persistence
- **Priority**: Must
- **Type**: Non-Functional
- **Statement**: THE system SHALL persist all user data in IndexedDB using a versioned schema with upgrade support
- **Acceptance Criteria**:
  1. GIVEN vocabulary card state WHEN updated THEN the record containing FSRS parameters (stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, due date) and review history is persisted to the "cards" object store
  2. GIVEN a conversation session WHEN completed THEN a record with topic, transcript summary, assessment text, duration in seconds, user word count, and ISO 8601 timestamp is persisted to the "conversations" object store
  3. GIVEN exam results WHEN scored THEN a record with scenario_id, task_type, category scores object, total percentage, and ISO 8601 timestamp is persisted to the "examResults" object store
  4. GIVEN schedule progress WHEN an activity is completed THEN a record keyed by (day number, activity index) with completion status and timestamp is persisted to the "scheduleProgress" object store
  5. GIVEN the IndexedDB database WHEN opened THEN the version number is checked and if the existing version is older, the onupgradeneeded handler runs the appropriate migrations without data loss
- **Dependencies**: None

### REQ-013: Topic Filtering
- **Priority**: Should
- **Type**: Functional
- **Statement**: WHEN in vocabulary mode THE system SHALL allow filtering cards by topic
- **Acceptance Criteria**:
  1. GIVEN vocabulary mode WHEN loaded THEN topic filter chips are displayed above the card area, one per topic present in vocabulary.json (17 topics)
  2. GIVEN a selected topic filter WHEN active THEN only cards from that topic appear in the review queue
  3. GIVEN the study schedule WHEN today's topics are known THEN those topics are pre-selected as the default filter
  4. GIVEN no topic filter selected WHEN in vocabulary mode THEN all topics are included in the review queue
- **Dependencies**: REQ-004

### REQ-014: Conversation Scaffolding
- **Priority**: Should
- **Type**: Functional
- **Statement**: THE system SHALL provide scaffolding controls for conversation practice that modify Claude's behaviour
- **Acceptance Criteria**:
  1. GIVEN conversation mode WHEN loaded THEN a scaffolding level selector with three options (High, Medium, Low) is displayed, defaulting to the level appropriate for the current phase (High for Foundation days 1-8, Medium for Fluency days 9-17, Low for Exam Prep days 18-23)
  2. GIVEN High scaffolding WHEN active THEN the system prompt includes: "After each response, provide: a sentence starter for the student's next reply, 2-3 useful vocabulary words with translations, and a brief translation of your previous response."
  3. GIVEN Medium scaffolding WHEN active THEN the system prompt includes: "Correct errors by rephrasing what the student said correctly. Suggest better expressions when appropriate. Do not provide translations."
  4. GIVEN Low scaffolding WHEN active THEN the system prompt includes: "Respond naturally in French at A2 level. Only correct errors that significantly impede comprehension."
- **Dependencies**: REQ-006

### REQ-015: Mock Exam Timer
- **Priority**: Should
- **Type**: Functional
- **Statement**: WHEN running a full exam simulation THE system SHALL enforce time limits matching the real Fide exam
- **Acceptance Criteria**:
  1. GIVEN an oral exam simulation WHEN started via a "Full Mock Exam" option THEN a 40-minute countdown timer is displayed in the exam header
  2. GIVEN a written exam simulation WHEN started via a "Full Mock Exam" option THEN a 60-minute countdown timer is displayed in the exam header
  3. GIVEN the timer WHEN 5 minutes remain THEN the timer text turns red and a pulsing animation is applied
  4. GIVEN the timer WHEN it reaches 00:00 THEN the exam ends automatically, the user's progress up to that point is scored, and results are saved
- **Dependencies**: REQ-008, REQ-009

### REQ-016: Export Progress Data
- **Priority**: Could
- **Type**: Functional
- **Statement**: WHEN on the dashboard THE system SHALL allow exporting all progress data as a JSON file
- **Acceptance Criteria**:
  1. GIVEN the dashboard WHEN the user clicks the "Export Data" button THEN a JSON file is generated containing all IndexedDB data (cards, conversations, examResults, scheduleProgress) and downloaded via the browser's download mechanism with filename "french-tutor-export-YYYY-MM-DD.json"
- **Dependencies**: REQ-010, REQ-012

## Non-Functional Requirements

### REQ-NFR-001: Performance
- **Priority**: Must
- **Type**: Non-Functional
- **Statement**: THE system SHALL respond to user interactions within 200ms excluding network API calls
- **Acceptance Criteria**:
  1. GIVEN a page navigation WHEN triggered THEN the new view renders within 200ms (measured by time from click to first contentful paint of the target view)
  2. GIVEN an SRS card flip WHEN triggered THEN the answer reveal animation completes within 100ms
  3. GIVEN a Claude API request WHEN submitted with streaming THEN the first token appears in the UI within 2000ms of the request being sent (network-dependent, not a hard guarantee but a design target)
- **Dependencies**: None

### REQ-NFR-002: Browser Compatibility
- **Priority**: Must
- **Type**: Non-Functional
- **Statement**: THE system SHALL work in Chrome 90+ and Edge 90+ on macOS
- **Acceptance Criteria**:
  1. GIVEN Chrome 90+ WHEN used THEN all features including Web Speech API, IndexedDB, and SpeechSynthesis work correctly
  2. GIVEN a browser other than Chrome or Edge WHEN detected via user agent THEN a compatibility warning banner is displayed at the top of the page
- **Dependencies**: None

### REQ-NFR-003: Responsive Layout
- **Priority**: Should
- **Type**: Non-Functional
- **Statement**: THE system SHALL be usable on screens from 1024px to 2560px width
- **Acceptance Criteria**:
  1. GIVEN a viewport width of 1024px WHEN rendered THEN the sidebar and main content area fit without horizontal scrolling, with main content area at least 700px wide
  2. GIVEN a viewport width above 1440px WHEN rendered THEN the main content area has a max-width of 1200px and is horizontally centred
- **Dependencies**: REQ-002

## Assumptions

1. The user has an Anthropic API key with access to claude-sonnet-4-20250514.
2. The user runs Chrome or Edge on macOS (Web Speech API is not reliably available in Firefox or Safari).
3. The curriculum JSON files (schedule.json, vocabulary.json, scenarios/*.json) are correct and complete. The app does not validate curriculum data at runtime beyond basic type expectations.
4. The daily new card limit of 25 is fixed (not user-configurable). This matches the schedule's planned new words per day during the Foundation phase.
5. SpeechSynthesis voice availability varies by OS and browser. The app uses best-effort voice selection but cannot guarantee a specific voice exists.
6. The "pronunciation" scoring category in oral exams is approximated by STT success rate (percentage of user utterances that were recognised without requiring repetition), not by acoustic analysis.

## Glossary

| Term | Definition |
|---|---|
| Fide | Swiss framework for assessing language competence for migration and naturalisation purposes |
| CEFR | Common European Framework of Reference for Languages, a six-level scale (A1-C2) for language proficiency |
| FSRS | Free Spaced Repetition Scheduler, an evidence-based algorithm for optimising review intervals |
| SRS | Spaced Repetition System, a learning technique where review intervals increase with successful recall |
| STT | Speech-to-Text, converting spoken audio to written text via the SpeechRecognition API |
| TTS | Text-to-Speech, converting written text to spoken audio via the SpeechSynthesis API |
| Web Speech API | Browser API providing SpeechRecognition (STT) and SpeechSynthesis (TTS) interfaces |
| IndexedDB | Browser-native structured storage API supporting indexed queries and transactions |
| ts-fsrs | TypeScript implementation of the FSRS algorithm (npm package: ts-fsrs) |
| Scaffolding | Temporary learning support (hints, translations, corrections) that is gradually reduced as proficiency increases |
| EARS | Easy Approach to Requirements Syntax, a structured format for writing unambiguous requirements |
| MoSCoW | Prioritisation method: Must, Should, Could, Won't |
