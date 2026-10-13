import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Edit3,
  Check,
  RotateCcw,
  Tag,
  Search,
} from 'lucide-react';
import { MistakeItem } from '../types';
import { api } from '../lib/api';

export const MistakeNotebookPage: React.FC = () => {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'reviewing' | 'mastered'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  useEffect(() => {
    api.getMistakes()
      .then((res) => setMistakes(res.mistakes))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: MistakeItem['status']) => {
    try {
      const res = await api.updateMistake(id, { status: newStatus });
      setMistakes((prev) => prev.map((m) => (m.id === id ? res.mistake : m)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      const res = await api.updateMistake(id, { studentNotes: notesDraft });
      setMistakes((prev) => prev.map((m) => (m.id === id ? res.mistake : m)));
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskAi = async (mistake: MistakeItem) => {
    setAiLoadingId(mistake.id);
    try {
      const res = await api.explainQuestionWithAi(mistake.questionId, 'english');
      setAiExplanations((prev) => ({ ...prev, [mistake.id]: res.explanation }));
    } catch (err: any) {
      setAiExplanations((prev) => ({ ...prev, [mistake.id]: err.message || 'AI explanation unavailable' }));
    } finally {
      setAiLoadingId(null);
    }
  };

  const filteredMistakes =
    statusFilter === 'all'
      ? mistakes
      : mistakes.filter((m) => m.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Personal Mistake Notebook
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Automated error journal. Every question answered incorrectly in mock tests or practice sessions is logged here with your specific misconception, personal notes, and resolution tracker.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {(['all', 'unresolved', 'reviewing', 'mastered'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {st} ({st === 'all' ? mistakes.length : mistakes.filter((m) => m.status === st).length})
          </button>
        ))}
      </div>

      {/* Mistakes List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading error log...</div>
      ) : filteredMistakes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No mistakes in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Great job! Continue solving mock tests and practice questions. Any wrong answer will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((m) => (
            <div
              key={m.id}
              className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4"
            >
              {/* Top Row: Meta and Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{m.subjectName}</span>
                  <span>·</span>
                  <span>{m.topicName}</span>
                  <span>·</span>
                  <span className="capitalize">{m.sourceType.replace('_', ' ')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-400">Resolution Status:</span>
                  <select
                    value={m.status}
                    onChange={(e) => handleUpdateStatus(m.id, e.target.value as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none ${
                      m.status === 'mastered'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : m.status === 'reviewing'
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-rose-300 bg-rose-50 text-rose-800'
                    }`}
                  >
                    <option value="unresolved">Unresolved</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="mastered">Mastered</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base font-semibold text-slate-900">
                {m.questionText}
              </div>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                  <div className="text-[10px] uppercase font-bold text-rose-700 mb-0.5">Your Submitted Answer:</div>
                  <div className="font-medium">{m.yourAnswer}</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 mb-0.5">Verified Correct Answer:</div>
                  <div className="font-medium">{m.correctAnswer}</div>
                </div>
              </div>

              {/* Student Personal Notes */}
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span>My Takeaway & Conceptual Pitfall:</span>
                  {editingId !== m.id && (
                    <button
                      onClick={() => {
                        setEditingId(m.id);
                        setNotesDraft(m.studentNotes);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium text-[11px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Note
                    </button>
                  )}
                </div>

                {editingId === m.id ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNotes(m.id)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 italic">
                    "{m.studentNotes || 'No notes added yet. Click edit to add your conceptual trap takeaway.'}"
                  </p>
                )}
              </div>

              {/* AI Tutor Trap Analysis */}
              <div className="pt-1 flex flex-col gap-2">
                {!aiExplanations[m.id] ? (
                  <button
                    onClick={() => handleAskAi(m)}
                    disabled={aiLoadingId === m.id}
                    className="self-start flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{aiLoadingId === m.id ? 'Gemini 3.8 Analyzing Trap...' : 'Unpack Trap with Gemini AI Tutor'}</span>
                  </button>
                ) : (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2 font-mono">
                    <div className="flex items-center justify-between text-indigo-300 font-bold border-b border-slate-800 pb-1.5 font-sans">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Gemini 3.8 Pitfall Breakdown
                      </span>
                    </div>
                    <div className="whitespace-pre-line text-slate-200 font-sans text-xs leading-relaxed">
                      {aiExplanations[m.id]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
