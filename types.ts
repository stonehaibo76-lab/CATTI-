
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  STUDY_PLAN = 'STUDY_PLAN',
  TRANSLATION_LAB = 'TRANSLATION_LAB',
  VOCABULARY = 'VOCABULARY',
  AI_TUTOR = 'AI_TUTOR',
  WEEKLY_TEST = 'WEEKLY_TEST',
  SENTENCE_LIBRARY = 'SENTENCE_LIBRARY',
  ATTENDANCE = 'ATTENDANCE',
  MISTAKE_NOTEBOOK = 'MISTAKE_NOTEBOOK',
  COLLOCATIONS = 'COLLOCATIONS',
  HELP = 'HELP'
}

export interface StudyPhase {
  id: number;
  title: string;
  duration: string;
  focus: string[];
  tasks: string[];
  status: 'locked' | 'active' | 'completed';
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface TranslationReview {
  original: string;
  translation: string;
  critique: string;
  improvedVersion: string;
  cattiTips: string[];
}

export interface ComprehensiveExercise {
  type: 'vocabulary_replacement' | 'fill_in_blanks' | 'error_correction' | 'cloze';
  typeLabel: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface DailyLesson {
  id: string; // Used for persistence (e.g., date string)
  readingArticle: {
    title: string;
    source: string;
    content: string;
  };
  vocabulary: { word: string; meaning: string; usage: string }[];
  grammarPoint: { 
    topic: string; 
    explanation: string; 
    explanationCn: string;
    example: string;
    exampleCn: string;
  };
  comprehensiveExercises: ComprehensiveExercise[];
  exercise: { question: string; type: string };
}

export interface ArticleAnalysis {
  structures: { original: string; analysis: string }[];
  techniques: string[];
  referenceTranslation: string;
  grammarFocus: string;
}

export interface LibrarySentence {
  id: string;
  source: string;
  target: string;
  tags: string[];
  addedAt: string;
}

export interface VocabItem {
  word: string;
  meaning: string;
  usage: string;
  level?: string;
  pos?: string;
  addedAt: string;
  mastery?: number; // 0 to 5
  nextReviewAt?: string; // ISO String
  intervalDays?: number; // Current interval in days
  reviewCount?: number;
}

export interface MistakeItem {
  id: string;
  type: 'translation' | 'objective'; // 翻译题或客观题
  source: string; // 题目或原文
  userAnswer: string; // 用户答案
  correctAnswer: string; // 参考译文或正确选项
  analysis: string; // AI点评或解析
  tags: string[];
  addedAt: string;
  options?: string[]; // 新增：用于存储选择题的选项
}

export interface CollocationItem {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
  theme: string;
  addedAt: string;
}