import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookmarkCheck,
  AlertTriangle,
  Play,
  Calendar,
  Layers,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { AnalyticsOverview, StudyPlan, User } from '../types';
import { api } from '../lib/api';

interface DashboardProps {
  currentUser: User | null;
}

export const DashboardPage: React.FC<DashboardProps> = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAnalytics(), api.getStudyPlan()])
      .then(([analyticsRes, planRes]) => {
        setAnalytics(analyticsRes);
        setPlan(planRes.plan);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleTask = async (taskId: string, currentVal: boolean) => {
    try {
      const res = await api.togglePlanTask(taskId, !currentVal);
      setPlan(res.plan);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">Loading student dashboard...</div>;
  }

  const metrics = analytics?.metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome & Target Exam Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-cyan-300">
            <Flame className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span>{metrics?.studyStreakDays || 6}-Day Active Study Streak</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Targeting <span className="font-bold text-white">{currentUser?.targetExam}</span>. Keep momentum high—your mistake notebook has {metrics?.totalMistakesLogged || 1} concepts scheduled for revision.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/mock-tests"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Mock Test</span>
          </Link>
          <Link
            to="/ai-tutor"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors border border-indigo-400/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Tutor</span>
          </Link>
        </div>
      </div>

      {/* Primary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Tests Attempted</div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.totalTestsAttempted || 1}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Full scoring validated</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Overall Accuracy</div>
          <div className="text-3xl font-extrabold text-indigo-600">{metrics?.overallAccuracyPercentage || 75}%</div>
          <div className="text-[11px] text-slate-500">Based on submitted questions</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Avg Speed Per Question</div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.avgTimePerQuestionSeconds || 65}s</div>
          <div className="text-[11px] text-slate-500">Benchmark: 80s / question</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Mistake Notebook</div>
          <div className="text-3xl font-extrabold text-amber-600">{metrics?.totalMistakesLogged || 1}</div>
          <div className="text-[11px] text-slate-500">
            {metrics?.masteredMistakesCount || 0} mastered
          </div>
        </div>
      </div>

      {/* 2-Column Section: Study Plan Tasks & Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Study Plan Tasks (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Today's Personalized Revision Plan</h2>
              <p className="text-xs text-slate-500">Generated based on upcoming exam date and priority topics</p>
            </div>
            <Link
              to="/study-planner"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Manage Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {plan?.tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id, task.completed)}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  task.completed
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors ${
                      task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.title}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{task.subject}</span>
                      <span>·</span>
                      <span>{task.targetQuestions} Questions</span>
                      <span>·</span>
                      <span>{task.estimatedMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    task.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Weak Topics & Mistake Alert (1 col) */}
        <div className="space-y-6">
          {/* Weak Topics Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Weak Topic Alerts</span>
              </h3>
              <Link to="/analytics" className="text-xs font-semibold text-indigo-600 hover:underline">
                Analytics →
              </Link>
            </div>

            <p className="text-xs text-slate-500">
              Concepts where you logged wrong answers in recent diagnostic tests:
            </p>

            <div className="space-y-2.5">
              {analytics?.weakTopics.length ? (
                analytics.weakTopics.map((wt, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <div className="font-bold text-slate-900">{wt.topic}</div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{wt.subject}</span>
                      <span className="text-rose-600 font-semibold">{wt.count} errors logged</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-4">No critical weak spots detected yet!</div>
              )}
            </div>

            <Link
              to="/mistake-notebook"
              className="block text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Open Mistake Notebook
            </Link>
          </div>

          {/* Quick AI Tutor Help Card */}
          <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 space-y-3 text-xs">
            <div className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Need help clarifying a concept?</span>
            </div>
            <p className="text-indigo-800 leading-relaxed">
              Ask Gemini 3.8 to break down any formula, mechanism, or proof in simple English or conversational Hinglish.
            </p>
            <Link
              to="/ai-tutor"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs hover:bg-indigo-700 transition-colors"
            >
              Start Chat with AI Tutor
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Attempts History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">Recent Mock Exam Attempts</h2>

        {analytics?.recentAttempts.length ? (
          <div className="space-y-3">
            {analytics.recentAttempts.map((att) => (
              <div
                key={att.id}
                className="p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{att.mockTestTitle}</div>
                  <div className="text-slate-500 mt-0.5">
                    {att.examName} · Attempted on {new Date(att.startedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {att.score} / {att.maxMarks}
                    </span>
                    <span className="text-slate-400 ml-1">marks</span>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                    {att.accuracyPercentage}% Accuracy
                  </div>
                  <Link
                    to={`/attempts/${att.id}`}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                  >
                    Review Solutions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">No mock tests attempted yet.</div>
        )}
      </div>
    </div>
  );
};
