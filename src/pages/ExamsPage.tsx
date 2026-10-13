import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { Exam } from '../types';
import { api } from '../lib/api';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Entrance', 'Competitive', 'School Board', 'University'];

  useEffect(() => {
    api.getExams()
      .then((res) => setExams(res.exams))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredExams =
    activeCategory === 'All'
      ? exams
      : exams.filter((e) => e.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Examinations Directory
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Browse organized previous year question archives for Indian competitive exams, entrance tests, state university semesters, and senior secondary school boards.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === cat
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-12 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{exam.category}</span>
                  <span className="font-mono text-indigo-600 font-bold">{exam.shortCode}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {exam.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {exam.description}
                </p>

                <div className="pt-2 text-xs text-slate-500">
                  <div className="font-semibold text-slate-700 mb-1">Core Subjects:</div>
                  <div className="flex flex-wrap gap-1">
                    {exam.subjects.map((sub) => (
                      <span key={sub} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 font-medium">
                  {exam.totalPapers} Papers · {exam.totalQuestions} Questions
                </div>
                <Link
                  to={`/exams/${exam.slug}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View Archive <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
