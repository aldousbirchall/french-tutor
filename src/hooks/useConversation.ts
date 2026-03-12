import { useState, useCallback, useRef } from 'react';
import { useClaudeService } from '../contexts/ClaudeContext';
import { useDatabaseService } from '../contexts/DatabaseContext';
import schedule from '../data/schedule';
import { getCurrentStudyDay } from '../utils/dateUtils';
import type { AppError, ConversationSession } from '../services/types';

/**
 * Target exchanges per conversation session, modelled on Fide oral exam tasks:
 * - Self-introduction: 6-8 exchanges
 * - Role-play: 6-10 exchanges
 * - Open discussion: 4-6 questions with elaboration
 * We target 8 as a good middle ground.
 */
const TARGET_EXCHANGES = 8;
const MAX_CONTEXT_TURNS = 20;

function getDefaultScaffolding(): ScaffoldingLevel {
  const dayNum = getCurrentStudyDay(schedule.start_date, new Date(), schedule.total_days);
  if (dayNum === null) return 'high';
  const phase = schedule.phases.find((p) => dayNum >= p.days[0] && dayNum <= p.days[1]);
  const name = phase?.name?.toLowerCase() ?? '';
  if (name.includes('exam')) return 'low';
  if (name.includes('fluency')) return 'medium';
  return 'high';
}

const SYSTEM_PROMPT = `You are an examiner conducting a Fide oral French exam at A1-A2 level. Your role is to guide a structured conversation, similar to the real exam format.

Rules:
- Speak only in French.
- Use vocabulary and grammar appropriate to CEFR A1-A2.
- Keep your sentences short and clear (2-3 sentences max per turn).
- Ask one question per turn. Wait for the candidate's response before continuing.
- Guide the conversation through the topic naturally, moving to different aspects.
- If the candidate makes errors, gently rephrase their sentence correctly in your response before asking the next question.

Session structure:
- You have roughly ${TARGET_EXCHANGES} exchanges total.
- Start by introducing the topic and asking an opening question.
- Progress through different aspects of the topic.
- On your final turn (around exchange ${TARGET_EXCHANGES}), wrap up naturally with a closing remark like "Merci, c'est très bien" or "Merci pour cette conversation" — do NOT ask another question.`;

const SCAFFOLDING_HIGH = `

Additional scaffolding (the candidate is a beginner):
- After each response, suggest 2-3 useful phrases with English translations in parentheses to help the candidate respond.
- If the candidate writes in English or seems stuck, provide a model answer they can adapt.
- Correct all errors explicitly: write "Correction: [corrected sentence]" before continuing.`;

const SCAFFOLDING_MEDIUM = `

Additional scaffolding (the candidate has some experience):
- Correct errors by naturally rephrasing the candidate's sentence in your response.
- Do not provide translations unless the candidate seems stuck.
- If the candidate gives very short answers, encourage elaboration with "Pouvez-vous expliquer un peu plus?"`;

const SCAFFOLDING_LOW = `

Minimal scaffolding (exam-realistic):
- Respond naturally as a real examiner would.
- Only correct errors that significantly impede communication.
- Do not provide translations or vocabulary help.`;

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
  const [scaffolding, setScaffolding] = useState<ScaffoldingLevel>(getDefaultScaffolding());
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const wordCountRef = useRef<number>(0);
  const [topic, setTopic] = useState('General conversation');

  const userTurnCount = messages.filter((m) => m.role === 'user').length;
  const isNearEnd = userTurnCount >= TARGET_EXCHANGES - 2;
  const isAtLimit = userTurnCount >= TARGET_EXCHANGES;

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
    prompt += `\n\nThe topic for this conversation is: "${topic}"`;
    prompt += `\n\nThe candidate has made ${userTurnCount} responses so far out of ~${TARGET_EXCHANGES} total.`;
    if (isNearEnd && !isAtLimit) {
      prompt += ` You are approaching the end — begin wrapping up in the next 1-2 turns.`;
    }
    if (isAtLimit) {
      prompt += ` This is the final exchange. Wrap up the conversation naturally with a closing remark. Do not ask another question.`;
    }
    return prompt;
  }, [scaffolding, topic, userTurnCount, isNearEnd, isAtLimit]);

  const sendMessage = useCallback(
    (text: string) => {
      if (streaming) return;

      const userMsg: Message = { role: 'user', content: text };
      wordCountRef.current += text.split(/\s+/).length;

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        if (updated.length > MAX_CONTEXT_TURNS * 2) {
          return updated.slice(-MAX_CONTEXT_TURNS * 2);
        }
        return updated;
      });

      setStreaming(true);
      setStreamingText('');
      setError(null);

      const allMessages = [...messages, userMsg].slice(-MAX_CONTEXT_TURNS * 2);

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
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
    setStreamingText('');

    if (messages.length === 0) return;

    await new Promise((r) => setTimeout(r, 50));

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const assessmentPrompt = `You are assessing a Fide A1-A2 French oral exam practice session. Based on the conversation below, provide:

1. A brief overall assessment (1-2 sentences)
2. Strengths (2-3 bullet points)
3. Areas to improve (2-3 bullet points)
4. Estimated CEFR level for this performance (A1, A1+, A2-, A2, A2+)

Write the assessment in English. Be constructive and specific.

Conversation topic: ${topic}
Exchanges: ${userTurnCount}

${messages.map((m) => `${m.role === 'user' ? 'Candidate' : 'Examiner'}: ${m.content}`).join('\n')}`;

    const assessmentAbort = new AbortController();
    abortRef.current = assessmentAbort;

    return new Promise<void>((resolve) => {
      claude.sendMessage({
        systemPrompt: 'You are a Fide French exam assessor. Provide structured, constructive feedback in English.',
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
  }, [claude, db, messages, topic, userTurnCount]);

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
    userTurnCount,
    targetExchanges: TARGET_EXCHANGES,
  };
}
