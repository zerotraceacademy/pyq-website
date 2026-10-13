import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  BookOpen,
  GraduationCap,
  Download,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BarChart3,
  Flame,
  FileCheck2,
  FileText,
} from 'lucide-react';
import { Exam, QuestionPaper } from '../types';
import { api } from '../lib/api';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [recentPapers, setRecentPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getExams(), api.getPapers()])
      .then(([examsRes, papersRes]) => {
        setExams(examsRes.exams);
        setRecentPapers(papersRes.papers.slice(0, 4));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next-Gen PYQ Preparation Engine with Gemini 3.8</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Prepare Smarter. <br />
              <span className="text-indigo-600">Practice Better.</span> Achieve More.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Access authentic previous year question papers from NTA, IITs, IISc, and CBSE. Solve under timed conditions, unpack answers with step-by-step verified solutions, and get instant concept tutoring.
            </p>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto pt-2">
              <div className="flex items-center bg-white rounded-2xl shadow-lg shadow-indigo-500/5 border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search exam (JEE Main, GATE, NEET), subject, topic, or year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors shrink-0"
                >
                  Explore Papers
                </button>
              </div>
            </form>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Popular:</span>
              {['JEE Main', 'JEE Advanced', 'GATE CS', 'NEET UG', 'CBSE Class 12'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/explore?search=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Real Metrics Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Verified Question Keys</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">2018–2024</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Official Exam Archive</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">12,000+</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Active Students</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">Gemini 3.8</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Real-Time Concept Tutor</div>
          </div>
        </div>
      </section>

      {/* Popular Examinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">Curated Catalog</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Target Your Examination</h2>
          </div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All Exams</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.slice(0, 6).map((exam) => (
            <Link
              key={exam.id}
              to={`/exams/${exam.slug}`}
              className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{exam.category}</span>
                  <span className="text-xs font-medium text-slate-600">{exam.totalPapers} Papers</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {exam.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {exam.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate max-w-[180px]">{exam.conductingBody}</span>
                <span className="font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Published Official Papers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">Official Archives</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Recent Question Papers</h2>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>Browse Full Repository</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentPapers.map((paper) => (
            <div
              key={paper.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{paper.examName}</span>
                    <span>·</span>
                    <span>{paper.year}</span>
                    <span>·</span>
                    <span>{paper.session}</span>
                  </div>
                  {paper.verifiedSolutionAvailable && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <Link
                  to={`/papers/${paper.slug}`}
                  className="block text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  {paper.title}
                </Link>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {paper.durationMinutes} mins
                  </span>
                  <span>Max Marks: {paper.maxMarks}</span>
                  <span>{paper.language}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  <span>{(paper.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  <span className="mx-1.5">·</span>
                  <span>{paper.downloadsCount.toLocaleString()} downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/papers/${paper.slug}`}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    View Paper
                  </Link>
                  <Link
                    to="/practice"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Practice Questions
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How PYQVerse Transforms Your Prep */}
      <section className="bg-slate-900 text-white py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">The 3-Step Exam Mastery Loop</h2>
            <p className="text-sm text-slate-400">
              Moving past passive reading. Solve under real conditions, discover exact conceptual gaps, and train with AI assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Authentic Exam Simulations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take authentic mock tests with server-authoritative timers, negative marking (-1, -0.33), and question palettes matching NTA and GATE real exam environments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Automated Mistake Notebook</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every wrong answer is automatically cataloged with your specific trap pattern, notes, and retry scheduler so you never repeat the same error.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Gemini 3.8 Concept Tutor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask the AI to explain derivations, uncover hidden question traps, and translate tough STEM theories into lucid English or friendly Hinglish.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/mock-tests"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Launch a Timed Mock Test Now</span>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Tutor Interactive Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bilingual Tutor (English + Hinglish)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Stuck on a tricky PYQ? Let Gemini 3.8 break it down.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              From Kings Property in calculus to Rotational Dynamics pure rolling and Organic Iodoform tests, get zero-nonsense step-by-step logic and trap alerts.
            </p>
            <div className="pt-2">
              <Link
                to="/ai-tutor"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-md"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Open Gemini AI Study Assistant</span>
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-96 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 text-xs space-y-3 font-mono shadow-2xl">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-700 pb-2">
              <span className="font-semibold text-indigo-300">PYQ AI Breakdown</span>
              <span>JEE 2024</span>
            </div>
            <div className="text-slate-300">
              <span className="text-emerald-400 font-bold">Q:</span> A solid sphere rolls without slipping down an incline...
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg text-slate-300 text-[11px] leading-relaxed border border-slate-700/50">
              <div className="text-amber-300 font-bold mb-1">💡 Core Trap Alert:</div>
              Remember that friction f is static, not kinetic. <br />
              <code className="text-cyan-300">a = (5/7) g sin θ</code>. 40% of aspirants forget the 2/5 sphere factor!
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
