import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '../../hooks/useConversation';
import { useSpeechService } from '../../contexts/SpeechContext';
import { useSchedule } from '../../hooks/useSchedule';
import ScaffoldingSelector from './ScaffoldingSelector';
import MessageList from './MessageList';
import VoiceInput from '../shared/VoiceInput';
import ConversationControls from './ConversationControls';
import AssessmentCard from './AssessmentCard';
import styles from './ConversationMode.module.css';

const ConversationMode: React.FC = () => {
  const { currentDay } = useSchedule();
  const speech = useSpeechService();
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

  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [duration, setDuration] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Set topic from today's schedule
  useEffect(() => {
    if (currentDay) {
      const conversationActivity = currentDay.activities.find(
        (a) => a.mode === 'conversation'
      );
      if (conversationActivity) {
        setTopic(conversationActivity.task);
      }
    }
  }, [currentDay, setTopic]);

  // Auto-speak assistant messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        speech.speak(lastMsg.content);
      }
    }
  }, [messages, speech]);

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
    startTimeRef.current = Date.now();
  }, [startNew]);

  if (assessment) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Conversation</h1>
        <AssessmentCard
          assessment={assessment}
          duration={duration}
          wordCount={wordCount}
          onNewConversation={handleNewTopic}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Conversation</h1>
      <div className={styles.topicLabel}>Topic: {topic}</div>
      <ScaffoldingSelector level={scaffolding} onChange={setScaffolding} />
      <MessageList messages={messages} streamingText={streamingText} />
      <div className={styles.inputArea}>
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          lang="fr-CH"
          isListening={isListening}
          onListeningChange={setIsListening}
        />
        <input
          className={styles.textInput}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type in French..."
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
      {error && <div className={styles.errorMsg}>{error.message}</div>}
      <ConversationControls
        onEnd={handleEnd}
        onNewTopic={handleNewTopic}
        disabled={streaming}
      />
    </div>
  );
};

export default ConversationMode;
