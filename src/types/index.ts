export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'editor' | 'admin';
  targetExam: string;
  preferredLanguage: 'english' | 'hinglish';
  avatar?: string;
  isDemoPersona?: boolean;
  createdAt: string;
}

export interface Exam {
  id: string;
  slug: string;
  name: string;
  shortCode: string;
  category: 'Competitive' | 'Entrance' | 'University' | 'School Board';
  conductingBody: string;
  description: string;
  totalPapers: number;
  totalQuestions: number;
  subjects: string[];
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
  code: string;
  examId: string;
  examName: string;
  topicsCount: number;
  papersCount: number;
  description: string;
}

export interface Topic {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  examId: string;
  frequencyScore: 'Very High' | 'High' | 'Medium' | 'Low';
  papersMapped: number;
  questionsCount: number;
}

export interface QuestionPaper {
  id: string;
  slug: string;
  title: string;
  examId: string;
  examName: string;
  subjectId?: string;
  subjectName?: string;
  institution: string;
  year: number;
  session: string;
  paperType: 'Official Exam' | 'Sample Paper' | 'Pre-Board' | 'Semester Main';
  durationMinutes: number;
  maxMarks: number;
  language: string;
  r2ObjectKey: string;
  fileSizeBytes: number;
  verifiedSolutionAvailable: boolean;
  reviewStatus: 'published' | 'pending_review' | 'draft';
  checksum: string;
  downloadsCount: number;
  viewsCount: number;
  createdAt: string;
}

export interface Question {
  id: string;
  paperId?: string;
  paperTitle?: string;
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  year: number;
  questionNumber: number;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  verifiedSolution: {
    finalAnswer: string;
    stepByStep: string[];
    keyConcept: string;
    commonMistakes: string;
  };
}

export interface MockTest {
  id: string;
  title: string;
  examId: string;
  examName: string;
  subjectName: string;
  durationMinutes: number;
  totalQuestions: number;
  maxMarks: number;
  negativeMarkingRatio: number;
  instructions: string[];
  questionIds: string[];
  attemptsCount: number;
  avgScore: number;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOption: string | null;
  timeSpentSeconds: number;
  markedForReview: boolean;
  isCorrect?: boolean;
  scoreAwarded?: number;
}

export interface TestAttempt {
  id: string;
  userId: string;
  mockTestId: string;
  mockTestTitle: string;
  examName: string;
  startedAt: string;
  submittedAt: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  timeRemainingSeconds: number;
  answers: Record<string, AttemptAnswer>;
  score?: number;
  maxMarks?: number;
  accuracyPercentage?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  totalTimeSpentSeconds?: number;
}

export interface MistakeItem {
  id: string;
  userId: string;
  questionId: string;
  questionText: string;
  subjectName: string;
  topicName: string;
  examName: string;
  yourAnswer: string;
  correctAnswer: string;
  status: 'unresolved' | 'reviewing' | 'mastered';
  studentNotes: string;
  sourceType: 'mock_test' | 'practice';
  recordedAt: string;
  lastReviewedAt?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  itemType: 'paper' | 'question';
  itemId: string;
  title: string;
  subtitle: string;
  notes?: string;
  createdAt: string;
}

export interface StudyPlanTask {
  id: string;
  title: string;
  subject: string;
  topic: string;
  targetQuestions: number;
  estimatedMinutes: number;
  completed: boolean;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StudyPlan {
  id: string;
  userId: string;
  targetExam: string;
  examDate: string;
  dailyHours: number;
  weakTopics: string[];
  totalTasks: number;
  completedTasks: number;
  tasks: StudyPlanTask[];
}

export interface ContentReport {
  id: string;
  userId: string;
  userEmail: string;
  entityType: 'paper' | 'question';
  entityId: string;
  issueType: 'typo' | 'incorrect_answer' | 'missing_diagram' | 'poor_resolution';
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface AnalyticsOverview {
  metrics: {
    totalTestsAttempted: number;
    studyStreakDays: number;
    overallAccuracyPercentage: number;
    averageScorePercentage: number;
    avgTimePerQuestionSeconds: number;
    totalMistakesLogged: number;
    masteredMistakesCount: number;
  };
  subjectBreakdown: {
    subject: string;
    accuracy: number;
    attempted: number;
    correct: number;
  }[];
  weakTopics: {
    topic: string;
    subject: string;
    count: number;
  }[];
  recentAttempts: TestAttempt[];
}
