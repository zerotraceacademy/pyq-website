import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Languages,
} from 'lucide-react';
import { Question, Exam, Subject, Topic } from '../types';
import { api } from '../lib/api';

export const PracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<{
    checked: boolean;
    isCorrect?: boolean;
    solution?: Question['verifiedSolution'];
  }>({ checked: false });

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<'english' | 'hinglish'>('english');
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const examId = searchParams.get('examId') || undefined;
  const subjectId = searchParams.get('subjectId') || undefined;
  const topicId = searchParams.get('topicId') || undefined;

  useEffect(() => {
    setLoading(true);
    api.getQuestions({ examId, subjectId, topicId })
      .then((res) => {
        setQuestions(res.questions);
        setCurrentIndex(0);
        resetQuestionState();
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [examId, subjectId, topicId]);

  const resetQuestionState = () => {
    setSelectedOption(null);
    setCheckResult({ checked: false });
    setAiExplanation(null);
    setBookmarked(false);
  };

  const currentQ = questions[currentIndex];

  const handleCheckAnswer = async () => {
    if (!currentQ || !selectedOption) return;
    try {
      const res = await api.checkAnswer(currentQ.id, selectedOption);
      setCheckResult({
        checked: true,
        isCorrect: res.isCorrect,
        solution: res.solution,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskAi = async () => {
    if (!currentQ) return;
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await api.explainQuestionWithAi(currentQ.id, aiLanguage);
      setAiExplanation(res.explanation);
    } catch (err: any) {
      setAiExplanation(`AI Tutor response: ${err.message || 'Error communicating with AI service.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetQuestionState();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      resetQuestionState();
    }
  };

  const handleBookmark = async () => {
    if (!currentQ) return;
    try {
      await api.addBookmark({
        itemType: 'question',
        itemId: currentQ.id,
        title: `Q${currentQ.questionNumber}: ${currentQ.topicName}`,
        subtitle: `${currentQ.subjectName} · ${currentQ.examName}`,
        notes: 'Bookmarked for targeted practice drill.',
      });
      setBookmarked(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">Loading practice questions...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-4 my-8">
        <BookOpen className="w-12 h-12 text-indigo-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No questions found for this filter</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Try clearing subject or topic filters to practice across our entire question repository.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-bold text-slate-900">{currentQ.examName}</span>
          <span>·</span>
          <span>{currentQ.subjectName}</span>
          <span>·</span>
          <span>{currentQ.topicName}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg border transition-colors ${
              bookmarked ? 'border-amber-300 text-amber-500 bg-amber-50' : 'border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Bookmark this problem"
          >
            {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono font-bold text-slate-800">
              Q{currentQ.questionNumber}
            </span>
            <span>Marks: +{currentQ.marks} / -{currentQ.negativeMarks}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
            {currentQ.difficulty}
          </span>
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
          {currentQ.questionText}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOption === opt.key;
            let optStyle = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800';

            if (checkResult.checked) {
              if (opt.key === currentQ.correctAnswer) {
                optStyle = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-400';
              } else if (isSelected && !checkResult.isCorrect) {
                optStyle = 'border-rose-300 bg-rose-50 text-rose-950 ring-1 ring-rose-300';
              } else {
                optStyle = 'border-slate-200 opacity-60 text-slate-600';
              }
            } else if (isSelected) {
              optStyle = 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600';
            }

            return (
              <button
                key={opt.key}
                disabled={checkResult.checked}
                onClick={() => setSelectedOption(opt.key)}
                className={`w-full text-left p-3.5 rounded-xl border text-sm flex items-start gap-3 transition-all ${optStyle}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {opt.key}
                </span>
                <span className="pt-0.5">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button Strip */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!checkResult.checked ? (
              <button
                disabled={!selectedOption}
                onClick={handleCheckAnswer}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={resetQuestionState}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}

            {/* AI Tutor Explanation CTA */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAskAi}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{aiLoading ? 'Gemini 3.8 Thinking...' : 'Explain with AI Tutor'}</span>
              </button>

              <button
                onClick={() => setAiLanguage((l) => (l === 'english' ? 'hinglish' : 'english'))}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium flex items-center gap-1"
                title="Toggle AI explanation language"
              >
                <Languages className="w-3 h-3 text-slate-500" />
                <span className="capitalize">{aiLanguage}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="p-2 rounded-xl bg-slate-900 text-white hover:bg-black disabled:opacity-40"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Verified Solution Section (Shown on check) */}
        {checkResult.checked && checkResult.solution && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              {checkResult.isCorrect ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Correct! (+{currentQ.marks} marks)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Incorrect. (-{currentQ.negativeMarks} marks) Logged to your Mistake Notebook!</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 border border-slate-200">
              <div className="font-bold text-slate-900">{checkResult.solution.finalAnswer}</div>
              <ul className="list-decimal pl-4 space-y-1 text-slate-600">
                {checkResult.solution.stepByStep.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Dynamic Gemini AI Breakdown Box */}
        {aiExplanation && (
          <div className="p-5 bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl space-y-3 text-xs leading-relaxed border border-indigo-800/60 shadow-lg">
            <div className="flex items-center justify-between text-indigo-300 font-semibold border-b border-indigo-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Gemini 3.8 Step-by-Step Breakdown ({aiLanguage})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Real-Time Tutor</span>
            </div>
            <div className="whitespace-pre-line text-slate-200 font-sans text-xs">
              {aiExplanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
