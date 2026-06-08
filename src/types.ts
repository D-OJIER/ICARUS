/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestDifficulty = 'Lesser Burden' | 'Sinuous Vow' | 'Mortal Penance';
export type QuestCategory = 'Vow' | 'Trial' | 'Crusade' | 'General' | 'Habit';

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  completed: boolean;
  createdAt: string;
  dueDate?: string; // ISO string
}

export interface GoalTask {
  id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  dayOffset: number;
  completed?: boolean;
}

export interface GoalStage {
  name: string;
  lore: string;
  tasks: GoalTask[];
}

export interface Goal {
  id: string;
  title: string;
  aspiration: string;
  categoryName: string;
  timelineExplanation: string;
  resources: string[];
  stages: GoalStage[];
  status: 'In Quest' | 'Triumphant' | 'Abandoned';
  createdAt: string;
  linkedQuestsAdded: boolean;
}

export interface CoachFeedback {
  appraisalTitle: string;
  appraisalContext: string;
  recommendations: string[];
  warnings: string[];
  successProbability: number;
}

export interface DarkQuote {
  text: string;
  author: string;
}

export const GOTHIC_QUOTES: DarkQuote[] = [
  { text: 'Sorrowful be the heart, Penitent One, for full is the silence of the Miracle.', author: 'Deogracias' },
  { text: 'What is a champion without a lord? Ashen One, go forth and gather the lords of cinder.', author: 'Fire Keeper' },
  { text: 'In the dark, we find truth. A strength forged in shadows and bound by guilt.', author: 'The Penitent One' },
  { text: 'Do not grieve, for every broken promise is a nail added to the crown of your guilt.', author: 'The Scribe' },
  { text: 'To be hollow is both a curse and a quiet relief from the weight of tomorrow.', author: 'Dismal Merchant' },
  { text: 'The light is a cage, but the shadow is where your true vows are written.', author: 'Lurking Void' },
  { text: 'No cost too great. No mind to think. No will to break.', author: 'The Pale King' },
  { text: 'May the flames guide thee, where embers never fade and knights stand eternal.', author: 'Lost Knight' }
];
