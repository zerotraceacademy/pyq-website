import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Sparkles,
  BookmarkCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { TestAttempt, MockTest, Question } from '../types';
import { api } from '../lib/api';

export const AttemptResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    setLoading(true);
    api.getAttemptReview(attemptId)
      .then((res) => {
        setAttempt(res.attempt);
        setTest(res.test);
        setQuestions(res.questions);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const handleAskAi = async (qId: string) => {
    setAiLoadingId(qId);
    try {
      const res = await api.explainQuestionWithAi(qId, 'english');
      setAiExplanations((prev) => ({ ...prev, [qId]: res.explanation }));
    } catch (err: any) {
      setAiExplanations((prev) => ({ ...prev, [qId]: err.message || 'AI Tutor unavailable' }));
    } finally {
      setAiLoadingId(null);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">Calculating official score...</div>;
  }

  if (!attempt || !test) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Attempt record not found</h2>
        <Link to="/mock-tests" className="text-xs font-semibold text-indigo-600 hover:underline">
          Return to Mock Tests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Scoreboard */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Examination Evaluated & Solutions Released</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {test.title}
            </h1>
            <p className="text-xs text-slate-500">{test.examName}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/mock-tests"
              className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Take Another Test</span>
            </Link>
            <Link
              to="/mistake-notebook"
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <span>View Mistake Notebook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-700">
              {attempt.score} <span className="text-base font-normal text-indigo-500">/ {attempt.maxMarks}</span>
            </div>
            <div className="text-xs font-semibold text-indigo-900 mt-1">Final Score Awarded</div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700">
              {attempt.accuracyPercentage}%
            </div>
            <div className="text-xs font-semibold text-emerald-900 mt-1">Accuracy</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-800">
              {attempt.correctCount} <span className="text-base font-normal text-slate-400">/ {questions.length}</span>
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">Correct Answers</div>
          </div>

          <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
            <div className="text-3xl sm:text-4xl font-extrabold text-rose-700">
              {attempt.incorrectCount}
            </div>
            <div className="text-xs font-semibold text-rose-900 mt-1">Incorrect (Mistakes Logged)</div>
          </div>
        </div>
      </div>

      {/* Question-by-Question Solution Review */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Question-by-Question Diagnostic Review</h2>

        {questions.map((q, idx) => {
          const userAns = attempt.answers[q.id];
          const isCorrect = userAns?.isCorrect;
          const selectedKey = userAns?.selectedOption;
          const userTime = userAns?.timeSpentSeconds || 0;

          return (
            <div
              key={q.id}
              className={`p-6 sm:p-8 bg-white rounded-3xl border transition-all space-y-5 shadow-xs ${
                isCorrect ? 'border-emerald-200' : selectedKey ? 'border-rose-200' : 'border-slate-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Q{idx + 1}</span>
                  <span>·</span>
                  <span>{q.subjectName}</span>
                  <span>·</span>
                  <span>{q.topicName}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Time: {userTime}s
                  </span>
                  {isCorrect ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Correct (+{q.marks})
                    </span>
                  ) : selectedKey ? (
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <XCircle className="w-4 h-4" /> Incorrect (-{q.negativeMarks})
                    </span>
                  ) : (
                    <span className="font-medium text-slate-500">Unanswered (0)</span>
                  )}
                </div>
              </div>

              {/* Statement */}
              <div className="text-base font-semibold text-slate-900 leading-relaxed">
                {q.questionText}
              </div>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
                {q.options.map((opt) => {
                  const isUserSelection = selectedKey === opt.key;
                  const isVerifiedCorrect = opt.key === q.correctAnswer;

                  let borderClass = 'border-slate-200 text-slate-700 bg-slate-50/50';
                  if (isVerifiedCorrect) {
                    borderClass = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold';
                  } else if (isUserSelection && !isCorrect) {
                    borderClass = 'border-rose-300 bg-rose-50 text-rose-950 font-bold';
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${borderClass}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-[10px]">
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold">
                        {isVerifiedCorrect && <span className="text-emerald-700">Official Correct Key</span>}
                        {isUserSelection && !isCorrect && <span className="text-rose-700">Your Selection</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step by step verified solution */}
              <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 border border-slate-200">
                <div className="font-bold text-slate-900">Verified Solution: {q.verifiedSolution.finalAnswer}</div>
                <ul className="list-decimal pl-4 space-y-1 text-slate-600">
                  {q.verifiedSolution.stepByStep.map((s, sIdx) => (
                    <li key={sIdx}>{s}</li>
                  ))}
                </ul>
                <div className="pt-2 text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/50">
                  <span className="font-bold">⚠️ Pitfall Alert: </span>
                  {q.verifiedSolution.commonMistakes}
                </div>
              </div>

              {/* Ask Gemini Tutor Button */}
              <div className="pt-1 flex flex-col gap-2">
                {!aiExplanations[q.id] ? (
                  <button
                    onClick={() => handleAskAi(q.id)}
                    disabled={aiLoadingId === q.id}
                    className="self-start flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{aiLoadingId === q.id ? 'Gemini 3.8 Analyzing Question...' : 'Ask Gemini AI Tutor to Explain'}</span>
                  </button>
                ) : (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2 font-mono">
                    <div className="flex items-center justify-between text-indigo-300 font-bold border-b border-slate-800 pb-1.5 font-sans">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Gemini 3.8 Deep Concept Breakdown
                      </span>
                    </div>
                    <div className="whitespace-pre-line text-slate-200 font-sans text-xs leading-relaxed">
                      {aiExplanations[q.id]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
