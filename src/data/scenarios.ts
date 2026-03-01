import selfIntroduction from './self-introduction.json';
import imageDescription from './image-description.json';
import rolePlay from './role-play.json';
import openDiscussion from './open-discussion.json';
import sequentialImages from './sequential-images.json';
import listeningComprehension from './listening-comprehension.json';
import formFilling from './form-filling.json';
import letterWriting from './letter-writing.json';
import type { ScenarioMap, ScenarioDefinition } from './types';

export const scenarios: ScenarioMap = {
  'self-introduction': selfIntroduction as ScenarioDefinition,
  'image-description': imageDescription as ScenarioDefinition,
  'role-play': rolePlay as ScenarioDefinition,
  'open-discussion': openDiscussion as ScenarioDefinition,
  'sequential-images': sequentialImages as ScenarioDefinition,
  'listening-comprehension': listeningComprehension as ScenarioDefinition,
  'form-filling': formFilling as ScenarioDefinition,
  'letter-writing': letterWriting as ScenarioDefinition,
};

export default scenarios;
