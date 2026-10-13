import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  Target,
  ArrowRight,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { StudyPlan } from '../types';
import { api } from '../lib/api';

export const StudyPlannerPage: React.FC = () => {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetExam, setTargetExam] = useState('JEE Main (Engineering)');
  const [examDate, setExamDate] = useState('2025-04-15');
  const [dailyHours, setDailyHours] = useState(4);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getStudyPlan()
      .then((res) => {
        setPlan(res.plan);
        if (res.plan) {
          setTargetExam(res.plan.targetExam);
          setExamDate(res.plan.examDate);
          setDailyHours(res.plan.dailyHours);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await api.togglePlanTask(taskId, !currentStatus);
      setPlan(res.plan);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.generateStudyPlan({
        targetExam,
        examDate,
        dailyHours: Number(dailyHours),
      });
      setPlan(res.plan);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading personalized study plan...</div>;
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  const completedCount = plan?.tasks.filter((t) => t.completed).length || 0;
  const totalCount = plan?.tasks.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Personalized Study Planner & Exam Schedule
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Algorithmic scheduling calibrated against your target exam date, daily hours, and weakest topics. Track daily revision deliverables and maintain high momentum.
        </p>
      </div>

      {/* Target Parameters Bar */}
      <form
        onSubmit={handleRegenerate}
        className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Target Examination</label>
          <select
            value={targetExam}
            onChange={(e) => setTargetExam(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="JEE Main (Engineering)">JEE Main (Engineering)</option>
            <option value="JEE Advanced (IIT Entrance)">JEE Advanced (IIT Entrance)</option>
            <option value="GATE Computer Science & IT">GATE Computer Science & IT</option>
            <option value="NEET UG (Medical)">NEET UG (Medical)</option>
            <option value="CBSE Class 12 Board Examinations">CBSE Class 12 Boards</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Exam Date</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Daily Study Bandwidth (Hours)</label>
          <input
            type="number"
            min="1"
            max="14"
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={generating}
            className="w-full flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generating ? 'Rebalancing Tasks...' : 'Regenerate Plan'}</span>
          </button>
        </div>
      </form>

      {/* Progress & Countdown Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Days Remaining to Exam</div>
          <div className="text-3xl font-extrabold text-indigo-600">{daysRemaining} Days</div>
          <div className="text-[11px] text-slate-500">Target Date: {examDate}</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Daily Bandwidth</div>
          <div className="text-3xl font-extrabold text-slate-900">{dailyHours} Hours / Day</div>
          <div className="text-[11px] text-emerald-600 font-medium">~{dailyHours * 35} questions target capacity</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Plan Completion Status</div>
          <div className="text-3xl font-extrabold text-emerald-600">{progressPercent}%</div>
          <div className="text-[11px] text-slate-500">{completedCount} of {totalCount} tasks completed</div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Scheduled Revision & Practice Tasks</h2>
          <span className="text-xs text-slate-500 font-medium">Click any task to toggle status</span>
        </div>

        <div className="space-y-3">
          {plan?.tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id, task.completed)}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                task.completed
                  ? 'bg-slate-50 border-slate-200 opacity-60'
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
                    <span>{task.topic}</span>
                    <span>·</span>
                    <span>Target: {task.targetQuestions} Questions</span>
                    <span>·</span>
                    <span>{task.estimatedMinutes} Mins</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 font-mono">Due: {task.dueDate}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    task.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
