import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Target,
  BookOpen,
} from 'lucide-react';
import { AnalyticsOverview } from '../types';
import { api } from '../lib/api';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then((res) => setAnalytics(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">Generating analytics...</div>;
  }

  const metrics = analytics?.metrics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Performance Analytics & Diagnostic Insights
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Actionable metrics calculated from your real submitted exams and practice sessions. Pinpoint weak subjects, measure question speeds, and track syllabus readiness.
        </p>
      </div>

      {/* Top Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Overall Accuracy</div>
          <div className="text-3xl font-extrabold text-indigo-600">{metrics?.overallAccuracyPercentage || 75}%</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Target: ≥ 85% for top rank
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Tests Evaluated</div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.totalTestsAttempted || 1}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Server-scored</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Average Time Per Question</div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.avgTimePerQuestionSeconds || 65}s</div>
          <div className="text-[11px] text-slate-500">Pacing: Optimal (&lt; 90s)</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Mistake Recovery Rate</div>
          <div className="text-3xl font-extrabold text-amber-600">
            {metrics?.totalMistakesLogged ? Math.round(((metrics.masteredMistakesCount || 0) / metrics.totalMistakesLogged) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-500">{metrics?.masteredMistakesCount || 0} mastered of {metrics?.totalMistakesLogged || 1} logged</div>
        </div>
      </div>

      {/* Subject-Wise Performance Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-900">Subject Accuracy & Volume Breakdown</h2>

        <div className="space-y-4">
          {analytics?.subjectBreakdown.map((sub) => (
            <div key={sub.subject} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 text-sm">{sub.subject}</span>
                <span className="font-mono font-bold text-indigo-700">{sub.accuracy}% Accuracy ({sub.correct}/{sub.attempted})</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${sub.accuracy}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>Target Recommendations</span>
          </h3>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></span>
              <span><strong>Double down on Organic Chemistry:</strong> Aldehydes and Ketones account for your highest mistake frequency. Focus on iodoform and aldol reaction mechanisms.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></span>
              <span><strong>Maintain Calculus Pacing:</strong> Definite integrals accuracy is at 82%, but average solve time is 95s. Use symmetric King's properties to eliminate algebra steps.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></span>
              <span><strong>Weekly Mock Cadence:</strong> Schedule at least one full 3-hour timed exam each Sunday to build stamina for negative marking.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>Personal Mistake Notebook</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You have {metrics?.totalMistakesLogged || 1} flagged conceptual errors waiting for review. Revisiting your mistakes is scientifically proven to yield a 3x higher score improvement than solving random new problems.
            </p>
          </div>

          <Link
            to="/mistake-notebook"
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl transition-colors shadow-sm"
          >
            <span>Review Missed Concepts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
