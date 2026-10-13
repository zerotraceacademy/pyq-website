import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ShieldCheck, Database, HardDrive, Sparkles, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Vision */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                PYQ<span className="text-indigo-400">Verse</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              India's premier intelligent Previous Year Questions platform. Access official archives, timed mock simulations, step-by-step verified solutions, and AI tutor explanations.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified NTA / Board Archives
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Gemini 3.8 AI Explanations
              </span>
            </div>
          </div>

          {/* Core Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Exam Vault</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/explore?examId=ex_jee_main" className="hover:text-white transition-colors">
                  JEE Main Papers
                </Link>
              </li>
              <li>
                <Link to="/explore?examId=ex_jee_adv" className="hover:text-white transition-colors">
                  JEE Advanced Papers
                </Link>
              </li>
              <li>
                <Link to="/explore?examId=ex_gate_cs" className="hover:text-white transition-colors">
                  GATE Computer Science
                </Link>
              </li>
              <li>
                <Link to="/explore?examId=ex_cbse_12" className="hover:text-white transition-colors">
                  CBSE Class 12 Boards
                </Link>
              </li>
              <li>
                <Link to="/exams" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  View All Exams →
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Tools */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Student Hub</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/mock-tests" className="hover:text-white transition-colors">
                  Timed Mock Simulator
                </Link>
              </li>
              <li>
                <Link to="/practice" className="hover:text-white transition-colors">
                  Subject Practice Drills
                </Link>
              </li>
              <li>
                <Link to="/ai-tutor" className="hover:text-white transition-colors">
                  Gemini AI Tutor
                </Link>
              </li>
              <li>
                <Link to="/mistake-notebook" className="hover:text-white transition-colors">
                  Mistake Notebook
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-white transition-colors">
                  Performance Analytics
                </Link>
              </li>
              <li>
                <Link to="/study-planner" className="hover:text-white transition-colors">
                  Study Planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Policies */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  Admin Console
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Support & Feedback
                </Link>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                <span>Cloudflare R2 Object Storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>MongoDB Atlas Data Layer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} PYQVerse. Educational rights reserved for respective conducting bodies.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
