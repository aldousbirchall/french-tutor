import { useState, useCallback, useRef } from 'react';
import { useClaudeService } from '../contexts/ClaudeContext';
import { useDatabaseService } from '../contexts/DatabaseContext';
import type { AppError, ConversationSession } from '../services/types';

const MAX_TURNS = 20;

const SYSTEM_PROMPT = `You are a French conversation partner. Speak only in French. Use vocabulary and grammar appropriate to CEFR A1-A2 level. Keep sentences short and clear. If the student makes an error, gently correct it in your next response.`;

const SCAFFOLDING_HIGH = `\n\nProvide heavy scaffolding: after each response, provide sentence starters and vocabulary words with translations to help the student respond. Include a translation of your response in parentheses. Correct all errors explicitly.`;

const SCAFFOLDING_MEDIUM = `\n\nProvide moderate scaffolding: correct errors by rephrasing the student's sentence correctly in your response. Do not provide translations. Only intervene when the student hesitates or makes repeated errors.`;

const SCAFFOLDING_LOW = `\n\nProvide minimal scaffolding: respond naturally at A2 level. Only correct errors that significantly impede communication. Do not suggest phrases or provide translations.`;

export type ScaffoldingLevel = 'high' | 'medium' | 'low';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useConversation() {
  const claude = useClaudeService();
  const db = useDatabaseService();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [assessment, setAssessment] = useState<string | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [scaffolding, setScaffolding] = useState<ScaffoldingLevel>('high');
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const wordCountRef = useRef<number>(0);
  const [topic, setTopic] = useState('General conversation');

  const getSystemPrompt = useCallback(() => {
    let prompt = SYSTEM_PROMPT;
    switch (scaffolding) {
      case 'high':
        prompt += SCAFFOLDING_HIGH;
        break;
      case 'medium':
        prompt += SCAFFOLDING_MEDIUM;
        break;
      case 'low':
        prompt += SCAFFOLDING_LOW;
        break;
    }
    return prompt;
  }, [scaffolding]);

  const sendMessage = useCallback(
    (text: string) => {
      if (streaming) return;

      const userMsg: Message = { role: 'user', content: text };
      wordCountRef.current += text.split(/\s+/).length;

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        // Trim to MAX_TURNS (each turn = 1 user + 1 assistant)
        if (updated.length > MAX_TURNS * 2) {
          return updated.slice(-MAX_TURNS * 2);
        }
        return updated;
      });

      setStreaming(true);
      setStreamingText('');
      setError(null);

      const allMessages = [...messages, userMsg].slice(-MAX_TURNS * 2);

      abortRef.current = claude.sendMessage({
        systemPrompt: getSystemPrompt(),
        messages: allMessages,
        onToken: (token) => {
          setStreamingText((prev) => prev + token);
        },
        onComplete: (fullText) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
          setStreaming(false);
          setStreamingText('');
        },
        onError: (err) => {
          setStreaming(false);
          setStreamingText('');
          setError(err);
        },
      });
    },
    [claude, messages, streaming, getSystemPrompt]
  );

  const endConversation = useCallback(async () => {
    // Cancel any in-progress streaming response before requesting assessment
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
    setStreamingText('');

    if (messages.length === 0) return;

    // Allow React state to settle and the SDK to clean up from the aborted stream
    await new Promise((r) => setTimeout(r, 50));

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    // Request assessment with a fresh AbortController
    const assessmentPrompt = `Based on the following conversation, provide a brief assessment (2-3 sentences) of the student's French level, strengths, and areas to improve. Write the assessment in English.\n\nConversation:\n${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`;

    const assessmentAbort = new AbortController();
    abortRef.current = assessmentAbort;

    return new Promise<void>((resolve) => {
      claude.sendMessage({
        systemPrompt: 'You are a French language assessor. Provide brief, constructive feedback in English.',
        messages: [{ role: 'user', content: assessmentPrompt }],
        onToken: () => {},
        onComplete: async (assessmentText) => {
          setAssessment(assessmentText);

          const session: ConversationSession = {
            topic,
            duration,
            userWordCount: wordCountRef.current,
            assessment: assessmentText,
            timestamp: new Date(),
          };
          await db.saveConversation(session);
          resolve();
        },
        onError: () => {
          setAssessment('Assessment unavailable.');
          resolve();
        },
      });
    });
  }, [claude, db, messages, topic]);

  const startNew = useCallback((newTopic?: string) => {
    setMessages([]);
    setAssessment(null);
    setError(null);
    setStreamingText('');
    startTimeRef.current = Date.now();
    wordCountRef.current = 0;
    if (newTopic) setTopic(newTopic);
  }, []);

  return {
    messages,
    streaming,
    streamingText,
    assessment,
    error,
    scaffolding,
    setScaffolding,
    topic,
    setTopic,
    sendMessage,
    endConversation,
    startNew,
  };
}
