# Security Report: french-tutor

**Date**: 2026-03-01
**Analyst**: Factory Security Agent
**Scope**: Browser SPA — local single-user personal study tool

---

## Threat Model Summary

### Application Profile

French-tutor is a single-page application with no backend. It runs entirely in the user's browser, persists data in IndexedDB, and makes outbound API calls only to `api.anthropic.com`. The user is always the same person who configured the API key. There is no authentication surface, no multi-tenancy, and no server to attack.

### Attack Surface

| Surface | Notes |
|---|---|
| localStorage (API key) | Readable by any JavaScript executing in the same origin |
| Outbound API calls | Anthropic API only; key travels in Authorization header over HTTPS |
| User text input | Typed French text, sent to Claude as message content |
| Voice transcription | Web Speech API output, same destination as typed input |
| IndexedDB | Same-origin access only; stores SRS state, conversation summaries, exam results |
| Bundled JSON data | Read-only curriculum data, no user-supplied content |
| Exported JSON file | Downloaded to disk on user request; contains study data, no credentials |

### Relevant Threats

For a personal local-use SPA, the realistic threats are:

1. **Credential theft**: API key exfiltrated via malicious browser extension, XSS, or DevTools inspection
2. **XSS leading to key exfiltration**: Injected scripts reading `localStorage`
3. **Prompt injection**: User-crafted input (typed or via STT) manipulating Claude's system prompt behaviour
4. **Devtools exposure**: API key visible in network tab and localStorage panel (unavoidable by design for browser-direct calls)
5. **Data leakage via export**: Exported JSON contains conversation transcripts and assessment text

Threats that do not apply here: server-side injection, authentication bypass, privilege escalation, SSRF, multi-user data isolation.

---

## Findings

| # | Priority | Title | File(s) | Description | Recommendation |
|---|---|---|---|---|---|
| S-01 | 2 | API key in plaintext localStorage | `src/utils/apiKey.ts`, `src/components/settings/ApiKeyForm.tsx` | The Anthropic API key is stored as plaintext in `localStorage` under the key `french-tutor-api-key`. Any script running at the same origin (including browser extensions with `tabs` permission or an injected script) can read it with `localStorage.getItem('french-tutor-api-key')`. This is inherent to browser-direct API calls — `dangerouslyAllowBrowser: true` exists precisely because the SDK cannot make the key safe in this context. | Accepted risk for this threat model. Document clearly in the UI hint (currently done: "stored locally and never sent to any server other than the Anthropic API"). No mitigation fully resolves this without a backend proxy. If the threat model widens, proxy the API calls through a local server and never expose the key to the browser at all. |
| S-02 | 2 | dangerouslyAllowBrowser exposes key in network traffic | `src/services/claude.ts:46` | The Anthropic SDK is initialised with `dangerouslyAllowBrowser: true`. The API key is sent as the `Authorization: Bearer sk-ant-...` header on every request to `api.anthropic.com`. Any network observer on the same machine (e.g. mitmproxy, Wireshark) or the browser's Network tab can read it. This is unavoidable given the architecture; the flag acknowledges it. | Accepted risk. The call goes over HTTPS, so network interception requires local access to the machine — which already implies full compromise. No mitigation short of a backend proxy. |
| S-03 | 2 | No Content Security Policy | `index.html`, `dist/index.html` | Neither the development `index.html` nor the built output sets a `Content-Security-Policy` meta tag or HTTP header. Without CSP, any injected script (via browser extension or hypothetical XSS) has unrestricted access to `localStorage`, IndexedDB, and the ability to make arbitrary requests. | Add a CSP meta tag to `index.html` restricting `script-src` to `'self'` and `connect-src` to `'self' https://api.anthropic.com`. Example: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; connect-src 'self' https://api.anthropic.com; style-src 'self' 'unsafe-inline';">`. Note: Vite's dev HMR requires `'unsafe-eval'` and `ws:` in dev mode; restrict only for production build. |
| S-04 | 3 | Unvalidated JSON from Claude used for exam scoring | `src/hooks/useExamSession.ts:112-117` | The `submitForScoring` function regex-extracts JSON from Claude's response and calls `JSON.parse` on it. If Claude returns malformed or unexpected JSON, the catch block silently sets a 0% score and blank feedback. If Claude returns numeric score values outside the expected range (e.g. negative numbers or values > 20), those values propagate to `IndexedDB` and the dashboard unchecked. | Low impact for this use case (scores are personal study data). Add bounds clamping: `Math.max(0, Math.min(20, score))` on each category value before storing. Consider validating that required keys are present before calculating `totalPercent`. |
| S-05 | 3 | User transcript content sent verbatim to Claude | `src/hooks/useConversation.ts:57-58`, `src/hooks/useExamSession.ts:49` | Voice transcription output and typed text are sent to Claude with no sanitisation or length cap. A user could construct unusually long inputs (thousands of words) that inflate token usage and API costs. In a multi-user scenario this would be a concern; for a personal tool it is self-harm. | Accepted risk for single-user tool. If cost control is desired, add a `maxLength` cap on user text before sending (e.g. 2000 characters). |
| S-06 | 3 | Assessment text rendered as React children without sanitisation | `src/components/conversation/AssessmentCard.tsx:30`, `src/components/exam/ExamScoreCard.tsx:43` | Claude's assessment text and feedback strings are rendered directly as `{assessment}` and `{feedback}` React children. React auto-escapes string content, so XSS via these fields is not possible. No `dangerouslySetInnerHTML` is present anywhere in the codebase. | No action required. React's default text rendering is safe. Noted for completeness. |
| S-07 | 3 | Dev-tooling vulnerabilities in devDependencies | `package.json`, npm audit | `npm audit` reports 5 moderate-severity vulnerabilities in `vite`, `vitest`, `vite-node`, `esbuild`, and `@vitest/mocker`. The esbuild vulnerability (allows any website to send requests to the dev server) is dev-server-only and has no impact on the production build or end-user. | These are devDependency vulnerabilities. The production build (`dist/`) is unaffected. No action required for production use. If running `vite dev` on a machine accessible to other users or on a network, update to Vite 7.3.1+ to remediate the esbuild issue. |
| S-08 | 3 | Error boundary leaks internal error messages | `src/components/shared/ErrorBoundary.tsx:41` | When `fallbackMessage` is not provided, the error boundary renders `this.state.error?.message` directly. For a personal tool the user is also the developer, so this is informative rather than a security concern. | No action required. Would matter in a multi-user deployment; not here. |

---

## No Issues Found

The following areas were inspected and are clean:

- **Hardcoded secrets**: No API keys, tokens, or credentials in source. No `.env` files present.
- **dangerouslySetInnerHTML**: Not used anywhere in the codebase.
- **eval / Function constructor**: Not used.
- **XSS via message bubbles**: `MessageBubble`, `AssessmentCard`, and all other content components use React text children, not innerHTML. Claude's response tokens are accumulated as strings and rendered safely.
- **Template injection in system prompts**: The `system_prompt_template` substitution in `useExamSession.ts` (line 37) uses `\{\{(\w+)\}\}` pattern matching against scenario data keys only — values come from bundled JSON, not user input. No user-supplied data is interpolated into system prompts.
- **IndexedDB injection**: IndexedDB is a structured data store with no query language; there is no SQL or query injection surface.
- **Prompt injection risk**: User message content is sent as the `content` field of a `user` role message. The system prompt is constructed from static constants and bundled scenario data only. No user text reaches the system prompt. Residual prompt injection risk (user attempting to override Claude's persona via message content) is a property of LLM behaviour, not a code defect, and is appropriate for a study tool.
- **Export data leakage**: The exported JSON contains study data and conversation assessments, not the API key. The key is not included in `DatabaseService.exportAll()`.

---

## Verdict

**PASS WITH FINDINGS**

The application is appropriate for its intended use as a personal local study tool. The two priority-2 findings (S-01, S-02) are architectural trade-offs accepted by the Anthropic SDK design: browser-direct API calls require key exposure. Both are correctly acknowledged in the UX.

The single actionable improvement is S-03: a Content Security Policy would materially reduce the blast radius of any hypothetical script injection without requiring architectural change. This is low-effort and worth adding.

S-04 (score bounds validation) is a minor data hygiene improvement worth one line of code per category.

No critical or high-severity findings. No hardcoded secrets. No XSS vectors. No SQL or query injection surfaces.
