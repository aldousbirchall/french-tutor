// Conjugation types
export interface ConjugationTense {
  label: string;
  forms: Record<string, string>;
  english: Record<string, string>;
}

export interface ConjugationVerb {
  infinitive: string;
  english: string;
  level: 'A1' | 'A2';
  auxiliary: string;
  group?: string;
  impersonal?: boolean;
  tenses: Record<string, ConjugationTense>;
}

export interface ConjugationCorpus {
  version: string;
  metadata: {
    total_verbs: number;
    tenses: string[];
    pronouns: string[];
  };
  verbs: ConjugationVerb[];
}

// Flattened conjugation item for flashcard/quiz use
export interface ConjugationItem {
  id: string;
  infinitive: string;
  pronoun: string;
  tense: string;
  tenseLabel: string;
  form: string;
  english: string;
  group?: string;
}

// Schedule types
export interface Schedule {
  version: string;
  exam_date: string;
  start_date: string;
  total_days: number;
  weekends_off: boolean;
  calendar_note?: string;
  phases: Phase[];
  days: StudyDay[];
}

export interface Phase {
  name: string;
  days: [number, number];
  focus: string;
  daily_time_minutes: number;
}

export interface StudyDay {
  day: number;
  date: string;
  weekday: string;
  phase: string;
  title: string;
  activities: Activity[];
  grammar_focus: string;
  topics: string[];
}

export interface Activity {
  mode: 'vocabulary' | 'conversation' | 'exam' | 'dashboard';
  task: string;
  minutes: number;
  new_words?: number;
}

// Vocabulary types
export interface VocabularyData {
  version: string;
  metadata: {
    total_words: number;
    levels: Record<string, number>;
    topics: string[];
  };
  words: VocabWord[];
}

export interface VocabWord {
  id: string;
  french: string;
  english: string;
  example_fr: string;
  example_en: string;
  topic: string;
  level: 'A1' | 'A2';
  pos: string;
  gender: string | null;
}

// Scenario types
export interface ScenarioDefinition {
  id: string;
  type: string;
  exam_section: string;
  level: string;
  title: string;
  description: string;
  duration_minutes: number;
  system_prompt?: string;
  system_prompt_template?: string;
  [key: string]: unknown;
}

export type ScenarioMap = Record<string, ScenarioDefinition>;

// Image description scenario
export interface ImagePrompt {
  id: string;
  description: string;
  expected_vocabulary: string[];
  follow_up_questions: string[];
}

// Role-play scenario
export interface RolePlayScenario {
  id: string;
  role: string;
  scenario: string;
  opening: string;
  key_functions: string[];
  expected_vocabulary: string[];
}

// Open discussion scenario
export interface DiscussionTopic {
  id: string;
  title: string;
  questions: string[];
  expected_structures: string[];
}

// Sequential images scenario
export interface ImageSequence {
  id: string;
  title: string;
  images: string[];
  expected_narration_elements: string[];
  key_connectors: string[];
}

// Listening comprehension scenario
export interface ListeningExercise {
  id: string;
  level: string;
  type: string;
  passage: string;
  word_count: number;
  questions: ListeningQuestion[];
  plays: number;
}

export interface ListeningQuestion {
  question: string;
  answer: string;
  distractors: string[];
}

// Form filling scenario
export interface FormDefinition {
  id: string;
  title: string;
  situation: string;
  fields: FormField[];
}

export interface FormField {
  label: string;
  type: string;
  hint: string;
  options?: string[];
}

// Dialogue corpus types
export interface DialogueTurn {
  speaker: 'examiner' | 'candidate';
  french: string;
  english: string;
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  type: 'gist' | 'response' | 'vocab_in_context';
  context_turn: number;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface ModelDialogue {
  id: string;
  scenario_type: string;
  scenario_id: string;
  title: string;
  level: 'A1' | 'A2';
  context: string;
  turns: DialogueTurn[];
  key_phrases: { french: string; english: string }[];
  questions: ComprehensionQuestion[];
}

export interface DialogueCorpus {
  version: string;
  metadata: {
    total_dialogues: number;
    scenario_types: string[];
  };
  dialogues: ModelDialogue[];
}

// Letter writing scenario
export interface LetterPrompt {
  id: string;
  level: string;
  situation: string;
  required_points: string[];
  word_target: [number, number];
  register: string;
  model_answer: string;
}
