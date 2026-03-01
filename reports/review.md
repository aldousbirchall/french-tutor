# Code Review: french-tutor

**Date**: 2026-03-01
**Reviewer**: Review Agent
**Scope**: Implementation against `specs/requirements.md` and `specs/design.md`

---

## Score Summary

| Category | Score | Max |
|---|---|---|
| Completeness | 26 | 30 |
| Code Quality | 22 | 25 |
| Architecture | 19 | 20 |
| Error Handling | 12 | 15 |
| Security | 9 | 10 |
| **Total** | **88** | **100** |

---

## Category Assessments

### Completeness — 26/30

All Must requirements are implemented. The four modes (Vocabulary, Conversation, Exam, Dashboard) are present and functional. All eight exam scenario types have dedicated UI components. IndexedDB schema matches the data model exactly, including the compound key on `scheduleProgress`. The FSRS integration uses `ts-fsrs` correctly. Export, streaming, and scoring flows are all wired up.

Three gaps reduce the score:

1. **REQ-003.6 (partial)**: The spec requires that on a weekend, the dashboard shows the most recent weekday's schedule. `ScheduleView` shows "Rest day — enjoy your weekend!" but does not display the prior weekday's schedule. The `getCurrentStudyDay` utility returns `null` on weekends, and `useSchedule` does not fall back to the most recent weekday entry.

2. **REQ-011.5 (absent)**: The spec requires a guidance message when microphone permission is not granted. `getMicrophonePermission()` is implemented in `SpeechService` and exposed via `useSpeech`, but no component calls it or displays a permission guidance message.

3. **REQ-014.1 (absent)**: The spec requires the scaffolding level to default to the appropriate level for the current study phase (High for Foundation days 1-8, Medium for Fluency days 9-17, Low for Exam Prep days 18-23). `useConversation` always initialises scaffolding to `'high'` regardless of phase.

All Should and Could requirements (REQ-013, REQ-014 levels, REQ-015, REQ-016) are otherwise present.

### Code Quality — 22/25

The codebase is clean and consistent. TypeScript strict mode is enabled throughout. CSS Modules are used correctly with camelCase convention. Hooks are well-separated from components. Service classes have clear single responsibilities. Data typing is thorough with a shared `types.ts` in both `services/` and `data/`.

Three issues:

1. **HTML entity in template literal** (`ActivityItem.tsx`, line 62): `{activity.new_words ? \` &middot; ${activity.new_words} new words\` : ''}` — the `&middot;` inside a JavaScript template literal renders as the literal string `&middot;`, not the middle-dot character. The preceding `&middot;` on line 61 is in JSX text and renders correctly. Should use `\u00B7` or a JSX fragment.

2. **ExamTimer interval thrash** (`ExamTimer.tsx`, lines 33-53): the `useEffect` dependency array includes `remaining`, which changes every second. This creates and destroys an interval on every tick. The functional equivalent is correct but idiomatic React would use a ref for `remaining` to avoid recreating the interval. This is a minor performance issue, not a bug.

3. **`getConversationStats` mislabelled variable** (`database.ts`, line 162-163): the variable is named `sevenDaysAgo` but is set to 14 days ago (`sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14)`). `recentSessions` in the returned `ConversationStats` object therefore covers 14 days, not 7. The `DashboardMode` then correctly filters sessions to 7 days for the readiness formula. But `ConversationStats.tsx` uses `convStats.recentSessions` directly to build the 14-day trend, which is correct by accident. The naming mismatch makes the intent unclear and is a latent bug if someone changes the window.

### Architecture — 19/20

The implementation closely follows `design.md`. The four-layer architecture (UI, Service, Data, Scheduling) is observed. Context providers wrap services as singletons. All eight custom hooks from the design are present. Error boundaries wrap each mode. The component hierarchy matches the spec tree almost exactly.

One minor deviation: `FullMockExam.tsx` uses inline styles rather than a module CSS file, diverging from the co-location pattern used everywhere else. This is cosmetic but inconsistent.

### Error Handling — 12/15

Claude API errors are mapped to typed `AppError` objects with user-friendly messages. 401, 429, 500+ errors are distinguished (REQ-007.3, REQ-007.4). Abort controllers are correctly wired for cancellation. The `DatabaseProvider` displays an error state if IndexedDB fails to initialise. `ErrorBoundary` wraps each mode and the app root.

Three gaps:

1. **Exam scoring parse failure is silent**: in `useExamSession.submitForScoring`, if the JSON parse fails the user sees `"Scoring failed. Please try again."` with a 0% score. There is no distinction between a network error, a malformed response, and a legitimate scoring. The fallback is acceptable but the error is logged to nowhere — `console.error` is missing in the catch block, making debugging difficult.

2. **`sendMessage` race condition**: in `useConversation.sendMessage`, the message history snapshot is taken from the closure (`const allMessages = [...messages, userMsg].slice(-MAX_TURNS * 2)`) but `setMessages` is also called with a functional update. If two messages are sent rapidly (edge case), the stale closure reference could produce a history that omits the most recent state update. This is low-risk given the `streaming` guard, but the pattern is fragile.

3. **No error display in exam scenario UIs**: several scenario UIs (`GuidedInterviewUI`, `ImageDescriptionUI`, etc.) use `useExamSession` which exposes an `error` state, but none of them render it. An API error during an exam session produces no visible feedback.

### Security — 9/10

The API key is stored in `localStorage`, not hard-coded. No secrets appear in source. `dangerouslyAllowBrowser: true` is set as required by the spec. No `dangerouslySetInnerHTML` or `eval` calls. Input validation is appropriate for a local SPA — the primary threat surface is the Claude API key, which is handled correctly.

One minor issue: the Anthropic client is re-instantiated on every `sendMessage` call (`new Anthropic({ apiKey, dangerouslyAllowBrowser: true })`). This is not a security defect, but it means the API key is read from `localStorage` on every call rather than once at startup. If a user clears the key mid-session, the next message will correctly fail with `NO_API_KEY`. This is actually correct behaviour, but the pattern is worth noting as intentional.

---

## Issues Table

| # | Severity | Description | File | Recommendation |
|---|---|---|---|---|
| 1 | Major | REQ-003.6 not implemented: weekend shows "rest day" message but does not display the prior weekday's schedule | `hooks/useSchedule.ts`, `components/dashboard/ScheduleView.tsx` | In `useSchedule`, when `dayNum` is null and today is a weekend, walk back from today to the most recent weekday and return that day's schedule with an `isRestDay` flag. Render the prior schedule in `ScheduleView` with a "Today is a rest day — showing yesterday's plan" banner. |
| 2 | Major | REQ-011.5 not implemented: no guidance message when microphone permission is denied | `components/shared/VoiceInput.tsx` | Call `speech.getMicrophonePermission()` on mount. If the result is `'denied'`, render a message explaining how to re-enable microphone access in browser settings. |
| 3 | Major | REQ-014.1 not implemented: scaffolding level does not default to phase-appropriate level | `hooks/useConversation.ts`, `components/conversation/ConversationMode.tsx` | Accept the current study phase as a parameter or derive it from `useSchedule` in `ConversationMode`. Pass the default level to `useConversation` or set it after mount. |
| 4 | Major | Written exam scoring uses wrong maximum: `Object.values(scores).length * 20` = 120, but written exam max is 100 (categories have non-uniform maxima: 20+15+15+20+15+15) | `hooks/useExamSession.ts`, line 116 | Use task-type-aware max: oral max = 100 (5 × 20), written max = 100 (20+15+15+20+15+15 = 100). Conveniently both sum to 100, so the correct formula is `(actualTotal / 100) * 100 = actualTotal`. Alternatively, embed max scores per category and sum them. |
| 5 | Minor | `&middot;` HTML entity inside a JS template literal renders as literal text `&middot;` | `components/dashboard/ActivityItem.tsx`, line 62 | Replace `\` &middot; ${activity.new_words} new words\`` with `<> · {activity.new_words} new words</>` or use `{'\u00B7'}`. |
| 6 | Minor | Mislabelled variable `sevenDaysAgo` is set to 14 days ago; confuses intent | `services/database.ts`, lines 162-163 | Rename to `fourteenDaysAgo` or change the offset to 7 and align the `ConversationStats` chart to 7 days. Decide which window is canonical for `recentSessions`. |
| 7 | Minor | Exam scenario UIs do not render API errors from `useExamSession.error` | `components/exam/scenarios/GuidedInterviewUI.tsx`, `RolePlayUI.tsx`, `ImageDescriptionUI.tsx`, `OpenDiscussionUI.tsx`, `SequentialImagesUI.tsx` | Check `error` from `useExamSession` and render a dismissible error banner in each scenario UI. |
| 8 | Minor | `useExamSession.submitForScoring` catch block does not log errors | `hooks/useExamSession.ts`, line 136 | Add `console.error('Scoring parse failed:', e)` in the catch block to aid debugging. |
| 9 | Minor | `ExamTimer` dependency array includes `remaining`, causing a new interval each second | `components/shared/ExamTimer.tsx`, line 53 | Move `remaining` to a `ref` and update the ref inside `setRemaining`. The effect then only depends on `[active, onExpired, clearTimer]`, and the interval is created once. |
| 10 | Minor | RolePlayUI sends the opening line as a user message rather than an assistant message | `components/exam/scenarios/RolePlayUI.tsx`, line 25 | The opening prompt should be injected as an initial assistant message (or as part of the system prompt) so the conversation starts with Claude speaking first, as per REQ-008.3. |

---

## Verdict

**ACCEPT WITH ISSUES**

The implementation is complete for all Must requirements except three (REQ-003.6, REQ-011.5, REQ-014.1) and has one functional scoring bug for written exams (issue 4). The architecture is sound, the code quality is high, and security is handled correctly. Issues 1-4 should be resolved before presenting the app to the user; issues 5-10 are minor and can be addressed in a follow-up pass.
