# Test Map: french-tutor holdout test suite

Maps every test to its requirement ID and acceptance criterion.

## Playwright Tests

### settings.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| shows settings page when no API key is stored | REQ-001 | AC1 |
| stores API key and navigates to main view on submit | REQ-001 | AC2 |
| settings page accessible from sidebar with masked key | REQ-001 | AC3 |
| clearing the API key removes it from localStorage | REQ-001 | AC4 |

### navigation.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| sidebar displays four mode entries | REQ-002 | AC1 |
| clicking a sidebar mode switches the main content view | REQ-002 | AC2 |
| active sidebar entry has a visually distinct highlight | REQ-002 | AC3 |
| sidebar shows icons only at viewport width below 768px | REQ-002 | AC4 |
| settings icon is positioned at the bottom of the sidebar | REQ-002 | AC5 |

### dashboard.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| displays the current study day information | REQ-003 | AC1 |
| shows day details including phase, activities, and grammar focus | REQ-003 | AC2 |
| clicking an activity item navigates to the corresponding mode | REQ-003 | AC3 |
| can mark an activity as completed and it persists | REQ-003 | AC4 |
| shows appropriate message when outside study period | REQ-003 | AC5 |
| weekend shows rest day indicator | REQ-003 | AC6 |
| displays vocabulary coverage and study streak metrics | REQ-010 | AC1 |
| shows topic breakdown for vocabulary coverage | REQ-010 | AC2 |
| displays conversation session statistics | REQ-010 | AC3 |
| displays exam results with scores | REQ-010 | AC4 |
| displays overall exam readiness estimate | REQ-010 | AC5 |
| shows "No data yet" when no data exists | REQ-010 | AC6 |

### vocabulary.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| shows summary bar with due and new card counts | REQ-004 | AC1 |
| presents review cards first, then new cards up to daily limit | REQ-004 | AC2 |
| card displays French word and triggers TTS | REQ-004 | AC3 |
| show answer reveals translation, example, and audio replay | REQ-004 | AC4 |
| selecting a difficulty rating saves card state to IndexedDB | REQ-004 | AC5 |
| shows Again, Hard, Good, Easy rating buttons | REQ-004 | AC5 |
| shows session complete summary when all cards are done | REQ-004 | AC7 |
| microphone button is available for voice input | REQ-005 | AC1 |
| speech recognition is configured with lang fr-CH | REQ-005 | AC1 |
| shows success/failure feedback on voice recognition result | REQ-005 | AC4, AC5 |

### conversation.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| displays a conversation starter prompt when loaded | REQ-006 | AC1 |
| user can send a message and receive a streamed response | REQ-006 | AC2 |
| Claude response is read aloud via TTS after streaming completes | REQ-006 | AC3 |
| conversation history is maintained across messages | REQ-006 | AC4 |
| end conversation button requests and displays assessment | REQ-006 | AC5 |
| completed conversation session is saved to IndexedDB | REQ-006 | AC6 |
| shows scaffolding level selector with three options | REQ-014 | AC1 |
| scaffolding level options are selectable | REQ-014 | AC2-4 |

### claude-api.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| API requests use claude-sonnet-4-20250514 model | REQ-007 | AC1 |
| shows user-friendly error on API failure | REQ-007 | AC3 |
| 401 error suggests checking API key in settings | REQ-007 | AC4 |
| Anthropic SDK initialised with dangerouslyAllowBrowser: true | REQ-007 | AC5 |
| conversation system prompt contains required instruction text | REQ-007 | AC6 |

### exam.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| displays exam task types grouped under Oral and Written | REQ-008 | AC1 |
| starting an exam task presents scenario content | REQ-008 | AC2 |
| role-play scenario has Claude responding in character | REQ-008 | AC3 |
| image description task shows a text description prompt | REQ-008 | AC4 |
| listening comprehension task plays audio and shows questions | REQ-008 | AC5 |
| form-filling exercise shows a form with input fields | REQ-008 | AC6 |
| letter-writing exercise shows situation description and textarea | REQ-008 | AC7 |
| completed exam task shows score and saves results | REQ-008 | AC8 |
| oral exam scoring shows five categories | REQ-009 | AC1 |
| score is displayed as a percentage with breakdown | REQ-009 | AC3 |
| saved score record includes required fields | REQ-009 | AC4 |
| full mock oral exam shows a countdown timer | REQ-015 | AC1 |
| full mock written exam shows a countdown timer | REQ-015 | AC2 |

### topic-filter.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| displays topic filter chips above the card area | REQ-013 | AC1 |
| selecting a topic filter restricts cards to that topic | REQ-013 | AC2 |
| topics for today's study schedule are pre-selected | REQ-013 | AC3 |
| with no filter selected all topics are included | REQ-013 | AC4 |

### speech-api.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| SpeechRecognition initialised with lang fr-CH and continuous false | REQ-011 | AC1 |
| TTS selects French voice with fr-CH preference | REQ-011 | AC2 |
| TTS rate is set to 0.9 | REQ-011 | AC3 |
| shows warning banner when SpeechRecognition is not available | REQ-011 | AC4 |
| shows guidance when microphone permission is not granted | REQ-011 | AC5 |

### data-persistence.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| IndexedDB database has correct object stores | REQ-012 | AC1-5 |
| cards object store has topic, due, and state indexes | REQ-012 | AC1 |
| conversations object store has timestamp index | REQ-012 | AC2 |
| examResults object store has taskType, timestamp, scenarioId indexes | REQ-012 | AC3 |
| scheduleProgress object store has day index | REQ-012 | AC4 |
| IndexedDB database has a version number | REQ-012 | AC5 |
| data persists across page reloads | REQ-012 | AC5 |

### export.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| Export Data button downloads a JSON file | REQ-016 | AC1 |

### visual.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| at 1024px: no horizontal scroll and content >= 700px | REQ-NFR-003 | AC1 |
| at 2560px: content max-width 1200px and centred | REQ-NFR-003 | AC2 |
| sidebar collapses to icons only at 768px | REQ-002 | AC4 |
| screenshot: Dashboard at 1024px/1440px/2560px | REQ-NFR-003 | Visual |
| screenshot: Vocabulary at 1024px/1440px/2560px | REQ-NFR-003 | Visual |
| screenshot: Exam at 1024px/1440px/2560px | REQ-NFR-003 | Visual |

### accessibility.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| Settings page passes WCAG 2.1 AA | Accessibility | All views |
| Dashboard view passes WCAG 2.1 AA | Accessibility | All views |
| Vocabulary view passes WCAG 2.1 AA | Accessibility | All views |
| Conversation view passes WCAG 2.1 AA | Accessibility | All views |
| Exam view passes WCAG 2.1 AA | Accessibility | All views |

### browser-compat.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| core navigation works across browsers | REQ-NFR-002 | AC1 |
| IndexedDB operations work across browsers | REQ-NFR-002 | AC1 |
| compatibility warning shown for unsupported browsers | REQ-NFR-002 | AC2 |

### performance.spec.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| navigation between modes completes within 200ms | REQ-NFR-001 | AC1 |
| card answer reveal is fast | REQ-NFR-001 | AC2 |

## Vitest Structural Tests

### bundled-data.test.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| vocabulary.json file exists | REQ-004 | Precondition |
| vocabulary.json contains array of word objects | REQ-004 | Precondition |
| each vocabulary word has required fields | REQ-004 | AC3 (data) |
| vocabulary words have valid level values | REQ-004 | Data integrity |
| vocabulary has at least 5 distinct topics | REQ-013 | AC1 (17 topics) |
| vocabulary word IDs are unique | REQ-012 | AC1 (keyPath) |
| vocabulary words have non-empty French/English fields | REQ-004 | AC3 |
| schedule.json file exists | REQ-003 | Precondition |
| schedule.json has start_date and exam_date | REQ-003 | AC1 |
| schedule contains study day definitions | REQ-003 | AC2 |
| study day activities have mode and minutes fields | REQ-003 | AC2 |
| study days have phase names | REQ-003 | AC2 |
| study days have grammar_focus text | REQ-003 | AC2 |
| schedule skips weekends | REQ-003 | AC1 |
| scenario files exist | REQ-008 | Precondition |
| scenario definitions have required structure | REQ-008 | AC2 |

### project-structure.test.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| src directory exists | All | Precondition |
| package.json has required dependencies | REQ-004, REQ-007 | Structural |
| vite.config exists | All | Precondition |
| tsconfig.json exists | All | Precondition |
| index.html exists | All | Precondition |
| index.html references entry point | All | Precondition |
| has main App component file | All | Structural |
| has main entry point | All | Structural |
| ts-fsrs is listed as dependency | REQ-004 | AC5 |
| @anthropic-ai/sdk is listed as dependency | REQ-007 | AC1 |
| source references french-tutor-db | REQ-012 | AC1 |
| source references localStorage for API key | REQ-001 | AC2 |
| source imports ts-fsrs | REQ-004 | AC5 |
| dangerouslyAllowBrowser set to true | REQ-007 | AC5 |
| correct model name in source | REQ-007 | AC1 |
| SpeechRecognition configured with fr-CH | REQ-011 | AC1 |
| TTS rate set to 0.9 | REQ-011 | AC3 |
| conversation system prompt text present | REQ-007 | AC6 |
| daily new card limit of 25 | REQ-004 | AC2 |

### scoring.test.ts
| Test | Requirement | Acceptance Criterion |
|---|---|---|
| oral scoring categories referenced | REQ-009 | AC1 |
| oral scoring uses 0-20 range | REQ-009 | AC1 |
| written scoring categories referenced | REQ-009 | AC2 |
| 40-minute oral exam duration | REQ-015 | AC1 |
| 60-minute written exam duration | REQ-015 | AC2 |
| 5-minute warning threshold | REQ-015 | AC3 |
| readiness formula weights (0.4, 0.3) | REQ-010 | AC5 |
| High scaffolding prompt text | REQ-014 | AC2 |
| Medium scaffolding prompt text | REQ-014 | AC3 |
| Low scaffolding prompt text | REQ-014 | AC4 |
| 20-turn conversation history limit | REQ-006 | AC4 |
| 1.5-second silence detection timeout | REQ-005 | AC3 |

## Coverage Summary

| Requirement | Tests | Status |
|---|---|---|
| REQ-001 (Settings) | 4 Playwright + 1 Vitest | Covered |
| REQ-002 (Navigation) | 5 Playwright + 1 Visual | Covered |
| REQ-003 (Schedule) | 6 Playwright + 7 Vitest | Covered |
| REQ-004 (Vocabulary SRS) | 7 Playwright + 6 Vitest | Covered |
| REQ-005 (Voice Production) | 3 Playwright + 1 Vitest | Covered |
| REQ-006 (Conversation) | 6 Playwright + 1 Vitest | Covered |
| REQ-007 (Claude API) | 5 Playwright + 4 Vitest | Covered |
| REQ-008 (Exam Simulation) | 8 Playwright + 2 Vitest | Covered |
| REQ-009 (Exam Scoring) | 3 Playwright + 3 Vitest | Covered |
| REQ-010 (Dashboard) | 6 Playwright + 1 Vitest | Covered |
| REQ-011 (Web Speech API) | 5 Playwright + 2 Vitest | Covered |
| REQ-012 (Data Persistence) | 7 Playwright + 1 Vitest | Covered |
| REQ-013 (Topic Filter) | 4 Playwright + 1 Vitest | Covered |
| REQ-014 (Scaffolding) | 2 Playwright + 3 Vitest | Covered |
| REQ-015 (Mock Timer) | 2 Playwright + 3 Vitest | Covered |
| REQ-016 (Export) | 1 Playwright | Covered |
| REQ-NFR-001 (Performance) | 2 Playwright | Covered |
| REQ-NFR-002 (Browser Compat) | 3 Playwright | Covered |
| REQ-NFR-003 (Responsive) | 3 Playwright + 9 Visual | Covered |
| Accessibility | 5 Playwright | Covered |

**Total: 88 Playwright tests + 37 Vitest tests = 125 tests**
