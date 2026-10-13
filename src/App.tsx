/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ExamsPage } from './pages/ExamsPage';
import { ExamDetailPage } from './pages/ExamDetailPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { PaperDetailPage } from './pages/PaperDetailPage';
import { PracticePage } from './pages/PracticePage';
import { MockTestsPage } from './pages/MockTestsPage';
import { MockExamSimulatorPage } from './pages/MockExamSimulatorPage';
import { AttemptResultPage } from './pages/AttemptResultPage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MistakeNotebookPage } from './pages/MistakeNotebookPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { AiTutorPage } from './pages/AiTutorPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PrivacyPolicyPage, TermsPage, ContactPage } from './pages/StaticPages';
import { User } from './types';
import { api } from './lib/api';

function AppLayout({
  currentUser,
  onRoleSwitch,
  onLanguageChange,
  onUserUpdated,
}: {
  currentUser: User | null;
  onRoleSwitch: (role: 'student' | 'editor' | 'admin') => void;
  onLanguageChange: (lang: 'english' | 'hinglish') => void;
  onUserUpdated: (u: User) => void;
}) {
  const location = useLocation();
  const isExamAttempt = location.pathname.includes('/attempt');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {!isExamAttempt && (
        <Navbar
          currentUser={currentUser}
          onRoleSwitch={onRoleSwitch}
          onLanguageChange={onLanguageChange}
        />
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/exams/:examSlug" element={<ExamDetailPage />} />
          <Route path="/subjects/:subjectSlug" element={<SubjectDetailPage />} />
          <Route path="/papers/:paperSlug" element={<PaperDetailPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/mock-tests" element={<MockTestsPage />} />
          <Route path="/mock-tests/:testId/attempt" element={<MockExamSimulatorPage />} />
          <Route path="/attempts/:attemptId" element={<AttemptResultPage />} />
          <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} />} />
          <Route path="/my-learning" element={<DashboardPage currentUser={currentUser} />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/mistake-notebook" element={<MistakeNotebookPage />} />
          <Route path="/study-planner" element={<StudyPlannerPage />} />
          <Route path="/ai-tutor" element={<AiTutorPage />} />
          <Route path="/ai-tutor/:conversationId" element={<AiTutorPage />} />
          <Route
            path="/profile"
            element={<ProfilePage currentUser={currentUser} onUserUpdated={onUserUpdated} />}
          />
          <Route path="/admin/*" element={<AdminDashboardPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>

      {!isExamAttempt && <Footer />}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    api.getCurrentUser()
      .then((res) => setCurrentUser(res.user))
      .catch((e) => console.error('Failed to load user session:', e));
  }, []);

  const handleRoleSwitch = async (role: 'student' | 'editor' | 'admin') => {
    try {
      const res = await api.switchRole(role);
      setCurrentUser(res.user);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLanguageChange = async (preferredLanguage: 'english' | 'hinglish') => {
    try {
      const res = await api.updateProfile({ preferredLanguage });
      setCurrentUser(res.user);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <BrowserRouter>
      <AppLayout
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        onLanguageChange={handleLanguageChange}
        onUserUpdated={(u) => setCurrentUser(u)}
      />
    </BrowserRouter>
  );
}
