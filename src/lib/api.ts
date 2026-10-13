import {
  User,
  Exam,
  Subject,
  Topic,
  QuestionPaper,
  Question,
  MockTest,
  TestAttempt,
  MistakeItem,
  Bookmark,
  StudyPlan,
  AnalyticsOverview,
} from '../types';

/**
 * Resolves the authoritative backend base API URL with strict prefix normalization.
 * Strips trailing slashes and ensures /api/v1 is appended cleanly if not already present.
 * Defaults to relative '/api/v1' for local development with Vite dev proxy.
 */
export function resolveApiBaseUrl(rawEnvUrl?: string): string {
  const envUrl = (rawEnvUrl || '').trim();
  if (!envUrl) {
    return '/api/v1';
  }
  const cleanUrl = envUrl.replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  }
  if (cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/v1`;
  }
  return `${cleanUrl}/api/v1`;
}

export const API_BASE = resolveApiBaseUrl((import.meta as any).env?.VITE_API_URL);

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pyqverse_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  const endpoint = `${API_BASE}${normalizedPath}`;

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; database: any; ai_providers: any; storage: any }>('/health'),

  // Auth
  getCurrentUser: () => fetchJson<{ user: User; isDemoPersona?: boolean }>('/auth/me'),
  switchRole: async (role: 'student' | 'editor' | 'admin') => {
    const res = await fetchJson<{ success: boolean; user: User; access_token?: string }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.access_token && typeof window !== 'undefined') {
      localStorage.setItem('pyqverse_token', res.access_token);
    }
    return res;
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pyqverse_token');
    }
  },
  updateProfile: (data: Partial<User>) =>
    fetchJson<{ success: boolean; user: User }>('/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Exams & Subjects
  getExams: () => fetchJson<{ exams: Exam[] }>('/exams'),
  getExamDetails: (slug: string) =>
    fetchJson<{ exam: Exam; subjects: Subject[]; papers: QuestionPaper[] }>(`/exams/${slug}`),
  getSubjects: () => fetchJson<{ subjects: Subject[] }>('/subjects'),
  getSubjectDetails: (slug: string) =>
    fetchJson<{ subject: Subject; topics: Topic[]; questions: Question[] }>(`/subjects/${slug}`),
  getTopics: () => fetchJson<{ topics: Topic[] }>('/topics'),

  // Papers
  getPapers: (params?: { examId?: string; year?: number | string; search?: string; paperType?: string }) => {
    const query = new URLSearchParams();
    if (params?.examId) query.set('examId', params.examId);
    if (params?.year) query.set('year', String(params.year));
    if (params?.search) query.set('search', params.search);
    if (params?.paperType) query.set('paperType', params.paperType);
    const qs = query.toString();
    return fetchJson<{ papers: QuestionPaper[] }>(`/papers${qs ? `?${qs}` : ''}`);
  },
  getPaperDetails: (slug: string) =>
    fetchJson<{ paper: QuestionPaper; questions: Question[] }>(`/papers/${slug}`),
  getPaperDownloadUrl: (id: string) =>
    fetchJson<{ downloadUrl: string; filename: string; expiresAt: string; fileSizeBytes: number }>(
      `/papers/${id}/download-url`
    ),

  // Questions & Practice
  getQuestions: (params?: { examId?: string; subjectId?: string; topicId?: string; difficulty?: string }) => {
    const query = new URLSearchParams();
    if (params?.examId) query.set('examId', params.examId);
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.topicId) query.set('topicId', params.topicId);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    const qs = query.toString();
    return fetchJson<{ questions: Question[] }>(`/questions${qs ? `?${qs}` : ''}`);
  },
  getQuestion: (id: string) => fetchJson<{ question: Question }>(`/questions/${id}`),
  checkAnswer: (id: string, selectedOption: string, notes?: string) =>
    fetchJson<{ isCorrect: boolean; correctAnswer: string; solution: Question['verifiedSolution'] }>(
      `/questions/${id}/check`,
      {
        method: 'POST',
        body: JSON.stringify({ selectedOption, notes }),
      }
    ),

  // Mock Tests
  getMockTests: () => fetchJson<{ mockTests: MockTest[] }>('/mock-tests'),
  getMockTestDetails: (id: string) =>
    fetchJson<{ test: MockTest; questions: Question[] }>(`/mock-tests/${id}`),
  startMockTest: (id: string) =>
    fetchJson<{ attempt: TestAttempt; test: MockTest; questions: Question[] }>(
      `/mock-tests/${id}/start`,
      { method: 'POST' }
    ),
  saveTestProgress: (attemptId: string, answers: Record<string, any>, timeRemainingSeconds: number) =>
    fetchJson<{ success: boolean; savedAt: string }>(`/attempts/${attemptId}/save-progress`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeRemainingSeconds }),
    }),
  submitMockTest: (attemptId: string, answers: Record<string, any>) =>
    fetchJson<{ success: boolean; attempt: TestAttempt; test: MockTest }>(
      `/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }
    ),
  getAttemptReview: (id: string) =>
    fetchJson<{ attempt: TestAttempt; test: MockTest; questions: Question[] }>(`/attempts/${id}`),
  getUserAttempts: () => fetchJson<{ attempts: TestAttempt[] }>('/attempts'),

  // Analytics
  getAnalytics: () => fetchJson<AnalyticsOverview>('/analytics/overview'),

  // Mistakes
  getMistakes: () => fetchJson<{ mistakes: MistakeItem[] }>('/mistakes'),
  updateMistake: (id: string, data: { status?: MistakeItem['status']; studentNotes?: string }) =>
    fetchJson<{ success: boolean; mistake: MistakeItem }>(`/mistakes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Bookmarks
  getBookmarks: () => fetchJson<{ bookmarks: Bookmark[] }>('/bookmarks'),
  addBookmark: (data: Omit<Bookmark, 'id' | 'userId' | 'createdAt'>) =>
    fetchJson<{ success: boolean; bookmark: Bookmark }>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeBookmark: (id: string) =>
    fetchJson<{ success: boolean }>(`/bookmarks/${id}`, { method: 'DELETE' }),

  // Study Planner
  getStudyPlan: () => fetchJson<{ plan: StudyPlan }>('/study-plans'),
  generateStudyPlan: (data: { targetExam: string; examDate: string; dailyHours: number }) =>
    fetchJson<{ success: boolean; plan: StudyPlan }>('/study-plans/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  togglePlanTask: (taskId: string, completed: boolean) =>
    fetchJson<{ success: boolean; plan: StudyPlan }>(`/study-plans/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    }),

  // AI Service
  explainQuestionWithAi: (questionId: string, userLanguage: 'english' | 'hinglish' = 'english') =>
    fetchJson<{ explanation: string; source: string }>('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ questionId, userLanguage }),
    }),
  chatWithAiTutor: (message: string, examContext?: string, userLanguage: 'english' | 'hinglish' = 'english') =>
    fetchJson<{ reply: string; model: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, examContext, userLanguage }),
    }),

  // Admin
  getAdminStats: () => fetchJson<any>('/admin/dashboard-stats'),
  createPaper: (data: any) =>
    fetchJson<{ success: boolean; paper: QuestionPaper }>('/admin/papers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePaper: (id: string, data: any) =>
    fetchJson<{ success: boolean; paper: QuestionPaper }>(`/admin/papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  syncGoogleSheets: (mode: 'preview' | 'execute') =>
    fetchJson<any>('/integrations/google-sheets/sync', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),
  getR2UploadUrl: (filename: string, contentType: string) =>
    fetchJson<{ uploadUrl: string; objectKey: string; maxSizeBytes: number; expiresInSeconds: number }>(
      '/integrations/r2/upload-url',
      {
        method: 'POST',
        body: JSON.stringify({ filename, contentType }),
      }
    ),
};
