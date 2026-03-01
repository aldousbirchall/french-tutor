# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]: French Tutor
    - navigation [ref=e6]:
      - link "📖 Vocabulary" [ref=e7] [cursor=pointer]:
        - /url: /vocabulary
        - generic [ref=e8]: 📖
        - generic [ref=e9]: Vocabulary
      - link "💬 Conversation" [ref=e10] [cursor=pointer]:
        - /url: /conversation
        - generic [ref=e11]: 💬
        - generic [ref=e12]: Conversation
      - link "📝 Exam" [ref=e13] [cursor=pointer]:
        - /url: /exam
        - generic [ref=e14]: 📝
        - generic [ref=e15]: Exam
      - link "📊 Dashboard" [ref=e16] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e17]: 📊
        - generic [ref=e18]: Dashboard
    - button "⚙ Settings" [ref=e19] [cursor=pointer]:
      - generic [ref=e20]: ⚙
      - generic [ref=e21]: Settings
  - main [ref=e22]:
    - generic [ref=e23]: For the best experience with voice features, use Chrome or Edge.
    - generic [ref=e25]:
      - heading "Settings" [level=1] [ref=e26]
      - generic [ref=e27]:
        - heading "API Configuration" [level=2] [ref=e28]
        - generic [ref=e30]:
          - generic [ref=e31]: Anthropic API Key
          - generic [ref=e32]:
            - textbox "Anthropic API Key" [ref=e33]:
              - /placeholder: sk-ant-...
            - button "Save" [active] [ref=e34] [cursor=pointer]
          - generic [ref=e35]: Your key is stored locally and never sent to any server other than the Anthropic API.
```