import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { MockTest, TestAttempt } from '../types';
import { api } from '../lib/api';

interface ExamQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options: { key: string; text: string }[];
  marks: number;
  negativeMarks: number;
  subjectName: string;
  topicName: string;
}

export const MockExamSimulatorPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<MockTest | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses
  const [answers, setAnswers] = useState<
    Record<string, { selectedOption: string | null; timeSpentSeconds: number; markedForReview: boolean }>
  >({});

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Exam Session
  useEffect(() => {
    if (!testId) return;
    setLoading(true);

    api.startMockTest(testId)
      .then((res) => {
        setTest(res.test);
        setAttempt(res.attempt);
        setQuestions(res.questions as ExamQuestion[]);
        setTimeRemaining(res.attempt.timeRemainingSeconds);

        // Prepopulate answers map
        const initialAnswers: typeof answers = {};
        res.questions.forEach((q) => {
          initialAnswers[q.id] = {
            selectedOption: null,
            timeSpentSeconds: 0,
            markedForReview: false,
          };
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => {
        console.error('Failed to start test:', err);
      })
      .finally(() => setLoading(false));
  }, [testId]);

  // Timer Tick & Autosave Interval
  useEffect(() => {
    if (!attempt || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }

        // Increment time spent on active question
        const currentQId = questions[currentIndex]?.id;
        if (currentQId) {
          setAnswers((prevAnswers) => {
            const currentAns = prevAnswers[currentQId] || {
              selectedOption: null,
              timeSpentSeconds: 0,
              markedForReview: false,
            };
            return {
              ...prevAnswers,
              [currentQId]: {
                ...currentAns,
                timeSpentSeconds: currentAns.timeSpentSeconds + 1,
              },
            };
          });
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt, currentIndex, questions]);

  // Periodic Autosave every 25 seconds
  useEffect(() => {
    if (!attempt) return;
    const autosaveTimer = setInterval(() => {
      api.saveTestProgress(attempt.id, answers, timeRemaining).catch((e) => console.warn('Autosave sync:', e));
    }, 25000);

    return () => clearInterval(autosaveTimer);
  }, [attempt, answers, timeRemaining]);

  const handleSelectOption = (optKey: string) => {
    const currentQId = questions[currentIndex]?.id;
    if (!currentQId) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQId]: {
        ...prev[currentQId],
        selectedOption: optKey,
      },
    }));
  };

  const handleClearResponse = () => {
    const currentQId = questions[currentIndex]?.id;
    if (!currentQId) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQId]: {
        ...prev[currentQId],
        selectedOption: null,
      },
    }));
  };

  const handleToggleMarkForReview = () => {
    const currentQId = questions[currentIndex]?.id;
    if (!currentQId) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQId]: {
        ...prev[currentQId],
        markedForReview: !prev[currentQId].markedForReview,
      },
    }));
  };

  const handleAutoSubmit = async () => {
    if (!attempt) return;
    setSubmitting(true);
    try {
      const res = await api.submitMockTest(attempt.id, answers);
      navigate(`/attempts/${res.attempt.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!attempt) return;
    setSubmitting(true);
    try {
      const res = await api.submitMockTest(attempt.id, answers);
      navigate(`/attempts/${res.attempt.id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-slate-900 text-white">
        <Clock className="w-10 h-10 animate-spin text-indigo-400" />
        <div className="text-sm font-semibold">Initializing Secure Exam Session...</div>
      </div>
    );
  }

  if (!test || !attempt || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Unable to load examination</h2>
        <button
          onClick={() => navigate('/mock-tests')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Mock Tests
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id];

  // Palette Counts
  let answeredCount = 0;
  let markedCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (ans?.selectedOption) {
      answeredCount += 1;
    } else {
      unansweredCount += 1;
    }
    if (ans?.markedForReview) {
      markedCount += 1;
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Exam Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">
              {test.title}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {test.examName} · Session ID: {attempt.id.slice(0, 12)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-bold ${
              timeRemaining < 300 ? 'bg-rose-950 text-rose-300 animate-pulse border border-rose-800' : 'bg-slate-800 text-cyan-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeRemaining)}</span>
          </div>

          <button
            onClick={() => setSubmitModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Question Canvas (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="space-y-6">
            {/* Question Top Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Question {currentIndex + 1}</span>
                <span>·</span>
                <span className="font-medium text-slate-700">{currentQ.subjectName}</span>
                <span>·</span>
                <span>{currentQ.topicName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-semibold font-mono">+{currentQ.marks} Marks</span>
                <span className="text-rose-700 font-semibold font-mono">-{currentQ.negativeMarks} Negative</span>
              </div>
            </div>

            {/* Question Statement */}
            <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
              {currentQ.questionText}
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = currentAnswer?.selectedOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-4 rounded-2xl border text-sm flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-2 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {opt.key}
                    </span>
                    <span className="pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Question Controls */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearResponse}
                disabled={!currentAnswer?.selectedOption}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Clear Response
              </button>
              <button
                onClick={handleToggleMarkForReview}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-medium transition-colors ${
                  currentAnswer?.markedForReview
                    ? 'border-purple-300 bg-purple-50 text-purple-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{currentAnswer?.markedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs disabled:opacity-40"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Palette & Status (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Question Palette ({questions.length})
            </h4>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-200"></span>
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="w-3 h-3 rounded-md bg-purple-500"></span>
                <span>Marked for Review ({markedCount})</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1 max-h-[360px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                let bgStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200';

                if (ans?.selectedOption && ans.markedForReview) {
                  bgStyle = 'bg-purple-600 text-white font-bold ring-2 ring-emerald-400';
                } else if (ans?.selectedOption) {
                  bgStyle = 'bg-emerald-600 text-white font-bold';
                } else if (ans?.markedForReview) {
                  bgStyle = 'bg-purple-500 text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-mono font-semibold flex items-center justify-center transition-all ${bgStyle} ${
                      isCurrent ? 'ring-2 ring-indigo-600 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* End Test Button */}
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition-all shadow-md"
          >
            Finish & Submit Examination
          </button>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Confirm Examination Submission</h3>
              <button onClick={() => setSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>Review your response summary before final evaluation:</p>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
                  <div className="text-xl font-bold">{answeredCount}</div>
                  <div className="text-[10px] uppercase font-semibold">Answered</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-100">
                  <div className="text-xl font-bold">{unansweredCount}</div>
                  <div className="text-[10px] uppercase font-semibold">Unanswered</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-900 border border-purple-100">
                  <div className="text-xl font-bold">{markedCount}</div>
                  <div className="text-[10px] uppercase font-semibold">Marked</div>
                </div>
              </div>

              <p className="text-[11px] text-amber-700 bg-amber-50 p-3 rounded-xl">
                ⚠️ Once submitted, answers are permanently scored on the server and verified solutions will be released.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                {submitting ? 'Scoring Answers...' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
