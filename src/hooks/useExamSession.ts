import { useState, useCallback, useRef } from 'react';
import { useClaudeService } from '../contexts/ClaudeContext';
import { useDatabaseService } from '../contexts/DatabaseContext';
import scenarios from '../data/scenarios';
import type { AppError, ExamResult } from '../services/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExamScores {
  scores: Record<string, number>;
  totalPercent: number;
  feedback: string;
}

export function useExamSession(scenarioId: string) {
  const claude = useClaudeService();
  const db = useDatabaseService();
  const scenario = scenarios[scenarioId];

  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [examScores, setExamScores] = useState<ExamScores | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const getSystemPrompt = useCallback((): string => {
    if (scenario?.system_prompt) return scenario.system_prompt as string;
    if (scenario?.system_prompt_template) {
      let tmpl = scenario.system_prompt_template as string;
      // Replace template variables from scenario data
      const scenarioData = scenario as Record<string, unknown>;
      tmpl = tmpl.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        return String(scenarioData[key] ?? key);
      });
      return tmpl;
    }
    return 'You are a French exam examiner.';
  }, [scenario]);

  const sendMessage = useCallback(
    (text: string) => {
      if (streaming || isComplete) return;

      const userMsg: Message = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);
      setStreamingText('');
      setError(null);

      const allMessages = [...messages, userMsg];

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
    [claude, messages, streaming, isComplete, getSystemPrompt]
  );

  const submitForScoring = useCallback(
    async (userResponses: string) => {
      if (!scenario) return;

      const isOral = (scenario.exam_section as string).includes('oral');
      const taskType = isOral ? 'oral' : 'written';

      let scoringPrompt: string;
      if (isOral) {
        scoringPrompt = `Score this oral exam response. Categories: task_completion (0-20), vocabulary_range (0-20), grammar_accuracy (0-20), fluency (0-20), pronunciation (0-20).

Scenario: ${scenario.title}
Student responses:
${userResponses}

Return ONLY valid JSON: {"scores": {"task_completion": N, "vocabulary_range": N, "grammar_accuracy": N, "fluency": N, "pronunciation": N}, "feedback": "brief feedback"}`;
      } else {
        scoringPrompt = `Score this written exam response. Categories: task_completion (0-20), register_appropriateness (0-15), structure (0-15), grammar (0-20), vocabulary (0-15), length_appropriateness (0-15).

Scenario: ${scenario.title}
Student response:
${userResponses}

Return ONLY valid JSON: {"scores": {"task_completion": N, "register_appropriateness": N, "structure": N, "grammar": N, "vocabulary": N, "length_appropriateness": N}, "feedback": "brief feedback"}`;
      }

      return new Promise<void>((resolve) => {
        claude.sendMessage({
          systemPrompt: 'You are a Fide exam scorer. Return only valid JSON.',
          messages: [{ role: 'user', content: scoringPrompt }],
          onToken: () => {},
          onComplete: async (text) => {
            try {
              // Extract JSON from response
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (!jsonMatch) throw new Error('No JSON found');
              const parsed = JSON.parse(jsonMatch[0]);
              const scores = parsed.scores as Record<string, number>;
              // Written exams have variable max per category (20, 15, 15, 20, 15, 15 = 100)
              // Oral exams have 5 × 20 = 100. Use 100 as max for both.
              const maxTotal = 100;
              const actualTotal = Object.values(scores).reduce((a: number, b: number) => a + b, 0);
              const totalPercent = Math.round((actualTotal / maxTotal) * 100);

              const result: ExamScores = {
                scores,
                totalPercent,
                feedback: parsed.feedback || '',
              };
              setExamScores(result);
              setIsComplete(true);

              const examResult: ExamResult = {
                scenarioId: scenario.id,
                taskType,
                scores,
                totalPercent,
                timestamp: new Date(),
              };
              await db.saveExamResult(examResult);
            } catch {
              setExamScores({
                scores: {},
                totalPercent: 0,
                feedback: 'Scoring failed. Please try again.',
              });
              setIsComplete(true);
            }
            resolve();
          },
          onError: () => {
            setExamScores({
              scores: {},
              totalPercent: 0,
              feedback: 'Scoring unavailable.',
            });
            setIsComplete(true);
            resolve();
          },
        });
      });
    },
    [claude, db, scenario]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setStreamingText('');
    setExamScores(null);
    setIsComplete(false);
    setError(null);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return {
    scenario,
    messages,
    streaming,
    streamingText,
    examScores,
    error,
    isComplete,
    sendMessage,
    submitForScoring,
    reset,
  };
}
