import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '../../hooks/useConversation';
import { useSchedule } from '../../hooks/useSchedule';
import { autoCompleteActivities } from '../../utils/scheduleAutoComplete';
import ModeIntro from '../shared/ModeIntro';
import ScaffoldingSelector from './ScaffoldingSelector';
import MessageList from './MessageList';
import VoiceInput from '../shared/VoiceInput';
import ConversationControls from './ConversationControls';
import AssessmentCard from './AssessmentCard';
import TopicPicker from './TopicPicker';
import styles from './ConversationMode.module.css';

interface LiveConversationProps {
  initialTopic?: string | null;
}

const LiveConversation: React.FC<LiveConversationProps> = ({ initialTopic }) => {
  const { currentDay, studyDayNumber, isActivityComplete, markComplete } = useSchedule();
  const {
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
  } = useConversation();

  const [started, setStarted] = useState(!!initialTopic);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [duration, setDuration] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Auto-start with initial topic from schedule deep-link
  const initialTopicApplied = useRef(false);
  useEffect(() => {
    if (initialTopic && !initialTopicApplied.current) {
      initialTopicApplied.current = true;
      setTopic(initialTopic);
      startTimeRef.current = Date.now();
    }
  }, [initialTopic, setTopic]);

  // Get suggested topic from schedule
  const scheduleTopic = (() => {
    if (!currentDay) return null;
    const activity = currentDay.activities.find((a) => a.mode === 'conversation');
    return activity?.task ?? null;
  })();

  const handleTopicSelect = useCallback((selectedTopic: string) => {
    setTopic(selectedTopic);
    setStarted(true);
    startTimeRef.current = Date.now();
  }, [setTopic]);

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const handleTextSend = useCallback(() => {
    if (!textInput.trim() || streaming) return;
    sendMessage(textInput.trim());
    setTextInput('');
  }, [textInput, streaming, sendMessage]);

  const handleEnd = useCallback(async () => {
    setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    const wc = messages
      .filter((m) => m.role === 'user')
      .reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
    setWordCount(wc);
    await endConversation();
  }, [endConversation, messages]);

  const handleNewTopic = useCallback(() => {
    startNew();
    setStarted(false);
    startTimeRef.current = Date.now();
  }, [startNew]);

  // Auto-mark conversation activity when assessment is received
  const markedRef2 = useRef(false);
  if (assessment && !markedRef2.current) {
    markedRef2.current = true;
    autoCompleteActivities('conversation', studyDayNumber, isActivityComplete, markComplete);
  }

  if (assessment) {
    return (
      <AssessmentCard
        assessment={assessment}
        duration={duration}
        wordCount={wordCount}
        onNewConversation={handleNewTopic}
      />
    );
  }

  if (!started) {
    return (
      <>
        <ModeIntro title="How Conversation Mode Works" storageKey="conversation">
          <p>
            Practice speaking French with an AI tutor. The tutor adapts to your
            level using the scaffolding setting below. Use voice input (hold Space)
            or type. The tutor will respond in French and read its reply aloud.
          </p>
        </ModeIntro>
        <TopicPicker
          onSelect={handleTopicSelect}
          suggestedTopic={scheduleTopic}
        />
      </>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.topicLabel}>{topic}</div>
        <ScaffoldingSelector level={scaffolding} onChange={setScaffolding} />
      </div>
      <div className={styles.chat}>
        <MessageList
          messages={messages}
          streamingText={streamingText}
          streaming={streaming}
          topic={topic}
        />
      </div>
      <div className={styles.inputArea}>
        <div className={styles.voiceCol}>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            lang="fr-CH"
            isListening={isListening}
            onListeningChange={setIsListening}
          />
          <span className={styles.inputHint}>Speak in French</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.textCol}>
          <div className={styles.textRow}>
            <input
              className={styles.textInput}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type in French..."
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              disabled={streaming}
            />
            <button
              className={styles.sendBtn}
              onClick={handleTextSend}
              disabled={streaming || !textInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      {error && <div className={styles.errorMsg}>{error.message}</div>}
      <ConversationControls
        onEnd={handleEnd}
        onNewTopic={handleNewTopic}
        disabled={streaming}
      />
    </>
  );
};

export default LiveConversation;
