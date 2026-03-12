import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '../../hooks/useConversation';
import { useSchedule } from '../../hooks/useSchedule';
import { autoCompleteActivities } from '../../utils/scheduleAutoComplete';
import ModeIntro from '../shared/ModeIntro';
import ScaffoldingSelector from './ScaffoldingSelector';
import MessageList from './MessageList';
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
    userTurnCount,
    targetExchanges,
  } = useConversation();

  const [started, setStarted] = useState(!!initialTopic);
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

  // Auto-end conversation when target exchanges reached and Claude has responded
  const autoEndTriggered = useRef(false);
  useEffect(() => {
    if (
      userTurnCount >= targetExchanges &&
      !streaming &&
      messages.length > 0 &&
      messages[messages.length - 1].role === 'assistant' &&
      !assessment &&
      !autoEndTriggered.current
    ) {
      autoEndTriggered.current = true;
      handleEnd();
    }
  }, [userTurnCount, targetExchanges, streaming, messages, assessment, handleEnd]);

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
            Practice French in exam-style conversations (~{targetExchanges} exchanges
            each, matching the Fide oral format). The examiner guides you through
            a topic, then provides an assessment at the end.
          </p>
        </ModeIntro>
        <TopicPicker
          onSelect={handleTopicSelect}
          suggestedTopic={scheduleTopic}
        />
      </>
    );
  }

  const remaining = Math.max(0, targetExchanges - userTurnCount);
  const inputDisabled = streaming || userTurnCount >= targetExchanges;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.topicLabel}>{topic}</div>
        <div className={styles.turnCounter}>
          {userTurnCount}/{targetExchanges}
        </div>
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
      {!inputDisabled && (
        <div className={styles.inputArea}>
          <div className={styles.textRow}>
            <input
              className={styles.textInput}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={remaining <= 2 ? `${remaining} exchange${remaining !== 1 ? 's' : ''} remaining...` : 'Type in French...'}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              disabled={inputDisabled}
            />
            <button
              className={styles.sendBtn}
              onClick={handleTextSend}
              disabled={inputDisabled || !textInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
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
