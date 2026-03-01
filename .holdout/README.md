# French Tutor Holdout Test Suite

Black-box test suite generated from requirements alone, with no knowledge of the implementation design. Tests verify observable behaviour through the browser (Playwright) and structural properties of the build output (Vitest).

## Structure

```
.holdout/
  package.json              # Test dependencies
  playwright.config.ts      # Playwright configuration (3 browsers)
  vitest.config.ts          # Vitest configuration
  test_map.md               # Maps every test to its requirement + AC
  README.md                 # This file
  tests/
    playwright/
      helpers.ts            # Shared setup: API mocks, Speech API mocks, navigation
      settings.spec.ts      # REQ-001: API key management
      navigation.spec.ts    # REQ-002: Sidebar navigation and layout
      dashboard.spec.ts     # REQ-003: Study schedule + REQ-010: Progress dashboard
      vocabulary.spec.ts    # REQ-004: SRS drill + REQ-005: Voice production
      conversation.spec.ts  # REQ-006: Conversation practice + REQ-014: Scaffolding
      claude-api.spec.ts    # REQ-007: Claude API integration
      exam.spec.ts          # REQ-008: Exam simulation + REQ-009: Scoring + REQ-015: Timer
      topic-filter.spec.ts  # REQ-013: Topic filtering
      speech-api.spec.ts    # REQ-011: Web Speech API
      data-persistence.spec.ts  # REQ-012: IndexedDB persistence
      export.spec.ts        # REQ-016: Export progress data
      visual.spec.ts        # REQ-NFR-003: Responsive layout + screenshots
      accessibility.spec.ts # WCAG 2.1 AA checks (axe-core)
      browser-compat.spec.ts # REQ-NFR-002: Cross-browser compatibility
      performance.spec.ts   # REQ-NFR-001: Interaction latency
    vitest/
      bundled-data.test.ts  # Validates curriculum JSON structure
      project-structure.test.ts  # Verifies project setup, dependencies, config values
      scoring.test.ts       # Verifies scoring constants, timer values, prompt text
```

## Running the Tests

### Prerequisites

```bash
cd .holdout
npm install
npx playwright install --with-deps chromium firefox webkit
```

### Run all tests

```bash
npm run test:all
```

### Run Vitest structural tests only

```bash
npm run test:vitest
```

### Run Playwright browser tests only

```bash
npm run test:playwright
```

### Run Playwright against a specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run a specific test file

```bash
npx playwright test tests/playwright/settings.spec.ts
npx vitest run tests/vitest/bundled-data.test.ts
```

## Test Strategy

### Playwright tests (interaction, visual, accessibility, browser compatibility)
- All tests operate through the browser. No source code imports.
- Anthropic API calls are intercepted via `page.route()` and return mock streaming responses.
- Web Speech API (SpeechRecognition, SpeechSynthesis) is mocked via `page.addInitScript()`.
- IndexedDB state is verified by evaluating JavaScript in the page context.
- API key is set via `localStorage` in `addInitScript` to bypass the settings page where needed.
- Visual regression tests capture screenshots at 1024px, 1440px, and 2560px viewports.
- Accessibility tests use `@axe-core/playwright` for WCAG 2.1 AA compliance.

### Vitest tests (structural verification)
- Verify that bundled data files (vocabulary.json, schedule.json, scenarios) exist and have correct structure.
- Verify that package.json lists required dependencies (ts-fsrs, @anthropic-ai/sdk).
- Verify that source code contains expected configuration values (model name, database name, TTS rate, locale).
- These tests scan the file system; they do not import source modules.

## Key Design Decisions

1. **No source imports**: All tests are black-box. Playwright tests interact through the browser UI. Vitest tests inspect file existence and content via `fs`, never `import`.

2. **Graceful degradation**: Many Playwright tests use `.isVisible().catch(() => false)` patterns. If a UI element is not found, the test either skips or adapts. This avoids brittle failures from minor UI variations while still catching missing functionality.

3. **Mock strategy**: The Anthropic API mock returns SSE streaming responses matching the SDK's expected format. The Web Speech API mock provides controllable `SpeechRecognition` instances that can simulate speech results via `simulateResult()`.

4. **IndexedDB verification**: Rather than importing database code, tests use `page.evaluate()` to open the database directly and inspect object stores, indexes, and records.

## Coverage

125 tests covering all 19 requirements (16 functional + 3 non-functional) plus accessibility. See `test_map.md` for the full mapping.
