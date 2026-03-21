import scenarios from '../../data/scenarios';
import GuidedInterviewUI from './scenarios/GuidedInterviewUI';
import ImageDescriptionUI from './scenarios/ImageDescriptionUI';
import RolePlayUI from './scenarios/RolePlayUI';
import OpenDiscussionUI from './scenarios/OpenDiscussionUI';
import SequentialImagesUI from './scenarios/SequentialImagesUI';
import ListeningComprehensionUI from './scenarios/ListeningComprehensionUI';
import FormFillingUI from './scenarios/FormFillingUI';
import LetterWritingUI from './scenarios/LetterWritingUI';
import styles from './ExamSession.module.css';

interface ExamSessionProps {
  scenarioId: string;
  taskHint?: string;
  onBack: () => void;
}

const ExamSession: React.FC<ExamSessionProps> = ({ scenarioId, taskHint, onBack }) => {
  const scenario = scenarios[scenarioId];
  if (!scenario) {
    return <div>Scenario not found.</div>;
  }

  const renderScenario = () => {
    switch (scenario.type) {
      case 'guided_interview':
        return <GuidedInterviewUI scenarioId={scenarioId} onBack={onBack} />;
      case 'image_description':
        return <ImageDescriptionUI scenarioId={scenarioId} taskHint={taskHint} onBack={onBack} />;
      case 'role_play':
        return <RolePlayUI scenarioId={scenarioId} taskHint={taskHint} onBack={onBack} />;
      case 'open_discussion':
        return <OpenDiscussionUI scenarioId={scenarioId} taskHint={taskHint} onBack={onBack} />;
      case 'sequential_image_narration':
        return <SequentialImagesUI scenarioId={scenarioId} taskHint={taskHint} onBack={onBack} />;
      case 'listening':
        return <ListeningComprehensionUI scenarioId={scenarioId} taskHint={taskHint} onBack={onBack} />;
      case 'form_filling':
        return <FormFillingUI scenarioId={scenarioId} taskHint={taskHint} onBack={onBack} />;
      case 'letter_writing':
        return <LetterWritingUI scenarioId={scenarioId} taskHint={taskHint} onBack={onBack} />;
      default:
        return <div>Unknown scenario type: {scenario.type}</div>;
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>
        &larr; Back to Tasks
      </button>
      {renderScenario()}
    </div>
  );
};

export default ExamSession;
