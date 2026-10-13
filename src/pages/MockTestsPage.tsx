import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { MockTest } from '../types';
import { api } from '../lib/api';

export const MockTestsPage: React.FC = () => {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getMockTests()
      .then((res) => setMockTests(res.mockTests))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Timed Mock Examination Simulator
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Simulate authentic computer-based tests under strict exam constraints. Features official question palettes, negative marking algorithms, and post-exam diagnostic review.
        </p>
      </div>

      {/* Instructions / Rules Banner */}
      <div className="p-6 bg-indigo-50/60 rounded-3xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Server-Authoritative Test Environment</span>
          </div>
          <p className="text-xs text-indigo-950 max-w-2xl leading-relaxed">
            All test timings and scoring rules are validated by the backend server. Reconnecting or refreshing automatically restores your active attempt and saved answers.
          </p>
        </div>
        <div className="text-xs text-indigo-800 font-semibold shrink-0">
          Negative Marking: Enforced (-1 or -1/3)
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-2/3"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockTests.map((test) => (
            <div
              key={test.id}
              className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{test.examName}</span>
                  <span className="font-mono text-indigo-600 font-bold">{test.totalQuestions} Questions</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-snug">{test.title}</h3>

                <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-600">
                  <div className="font-semibold text-slate-800">Syllabus Coverage:</div>
                  <div>{test.subjectName}</div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-extrabold text-slate-900 text-sm">{test.durationMinutes}m</div>
                    <div className="text-[10px] text-slate-400">Duration</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-extrabold text-slate-900 text-sm">{test.maxMarks}</div>
                    <div className="text-[10px] text-slate-400">Max Marks</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {test.negativeMarkingRatio > 0 ? `-${test.negativeMarkingRatio * 4}` : '0'}
                    </div>
                    <div className="text-[10px] text-slate-400">Negative Mark</div>
                  </div>
                </div>

                {/* Instructions snippet */}
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="font-semibold text-slate-700 text-[11px]">Instructions:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {test.instructions.slice(0, 2).map((ins, idx) => (
                      <li key={idx}>{ins}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span>{test.attemptsCount} attempts</span>
                  <span className="mx-1.5">·</span>
                  <span>Avg: {test.avgScore} marks</span>
                </div>

                <button
                  onClick={() => navigate(`/mock-tests/${test.id}/attempt`)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Mock Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
