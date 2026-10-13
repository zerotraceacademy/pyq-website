import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Sparkles,
  GraduationCap,
  LayoutDashboard,
  BrainCircuit,
  ShieldCheck,
  Menu,
  X,
  FileText,
  BookmarkCheck,
  Calendar,
  BarChart3,
  Globe,
  Layers,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onRoleSwitch: (role: 'student' | 'editor' | 'admin') => void;
  onLanguageChange?: (lang: 'english' | 'hinglish') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onRoleSwitch, onLanguageChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { name: 'Explore PYQs', path: '/explore', icon: Search },
    { name: 'Exams', path: '/exams', icon: Layers },
    { name: 'Practice', path: '/practice', icon: BookOpen },
    { name: 'Mock Tests', path: '/mock-tests', icon: GraduationCap },
    { name: 'AI Tutor', path: '/ai-tutor', icon: Sparkles, badge: 'Gemini 3.8' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">PYQ<span className="text-indigo-600">Verse</span></span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 -mt-1">Intelligent Exam Vault</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'text-indigo-600 bg-indigo-50/70 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-sm">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Student Hub Links */}
            <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
              <Link
                to="/dashboard"
                className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  isActive('/dashboard') ? 'bg-indigo-50 text-indigo-600' : ''
                }`}
                title="Student Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <Link
                to="/mistake-notebook"
                className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  isActive('/mistake-notebook') ? 'bg-indigo-50 text-indigo-600' : ''
                }`}
                title="Mistake Notebook"
              >
                <BookmarkCheck className="w-4 h-4" />
              </Link>
              <Link
                to="/analytics"
                className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  isActive('/analytics') ? 'bg-indigo-50 text-indigo-600' : ''
                }`}
                title="Performance Analytics"
              >
                <BarChart3 className="w-4 h-4" />
              </Link>
              <Link
                to="/study-planner"
                className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  isActive('/study-planner') ? 'bg-indigo-50 text-indigo-600' : ''
                }`}
                title="Study Planner"
              >
                <Calendar className="w-4 h-4" />
              </Link>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => {
                const nextLang = currentUser?.preferredLanguage === 'hinglish' ? 'english' : 'hinglish';
                onLanguageChange?.(nextLang);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Toggle AI Language output"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="capitalize">{currentUser?.preferredLanguage || 'English'}</span>
            </button>

            {/* Role Persona Switcher (Development/Demo Mode Only, disabled for production) */}
            <div className="relative">
              <button
                onClick={() => {
                  const isProd = import.meta.env.PROD && !currentUser?.isDemoPersona;
                  if (!isProd) {
                    setRoleMenuOpen(!roleMenuOpen);
                  }
                }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-800 shadow-sm transition-all"
                title={import.meta.env.PROD && !currentUser?.isDemoPersona ? "Verified Account" : "Development Persona Switcher"}
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden border border-slate-300 flex items-center justify-center">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-700">{currentUser?.name.charAt(0)}</span>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 leading-tight truncate max-w-[100px]">
                    {currentUser?.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-indigo-600 uppercase font-semibold leading-tight flex items-center gap-1">
                    {currentUser?.role}
                    {import.meta.env.PROD && !currentUser?.isDemoPersona && (
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded">Verified</span>
                    )}
                  </div>
                </div>
              </button>

              {roleMenuOpen && (import.meta.env.DEV || currentUser?.isDemoPersona !== false) && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Switch Test Persona</span>
                    <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">DEV/DEMO</span>
                  </div>
                  <button
                    onClick={() => {
                      onRoleSwitch('student');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 ${
                      currentUser?.role === 'student' ? 'bg-indigo-50/70 text-indigo-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div>Aarav Sharma (Student)</div>
                      <div className="text-[10px] text-slate-500 font-normal">JEE & Boards Aspirant</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onRoleSwitch('editor');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 ${
                      currentUser?.role === 'editor' ? 'bg-indigo-50/70 text-indigo-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Priya Mukherjee (Educator)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Content Reviewer</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onRoleSwitch('admin');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 ${
                      currentUser?.role === 'admin' ? 'bg-indigo-50/70 text-indigo-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <div>
                      <div>Prof. Rajesh (Administrator)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Full Catalog & R2 Storage</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 mt-2 pt-1">
                    <Link
                      to="/profile"
                      onClick={() => setRoleMenuOpen(false)}
                      className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      My Profile & Preferences
                    </Link>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
                      <Link
                        to="/admin"
                        onClick={() => setRoleMenuOpen(false)}
                        className="block px-3 py-1.5 text-indigo-600 font-medium hover:bg-indigo-50"
                      >
                        Admin Command Center →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin CTA Button if user is Admin/Editor */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-sm transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                    active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Student Hub</div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 rounded-lg"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/mistake-notebook"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 rounded-lg"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Mistake Book</span>
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 rounded-lg"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Analytics</span>
              </Link>
              <Link
                to="/study-planner"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 rounded-lg"
              >
                <Calendar className="w-3.5 h-3.5 text-violet-600" />
                <span>Study Planner</span>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Active: <span className="font-semibold text-slate-800">{currentUser?.name}</span> ({currentUser?.role})
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => onRoleSwitch('student')}
                className={`px-2 py-1 text-[11px] rounded ${currentUser?.role === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
              >
                Student
              </button>
              <button
                onClick={() => onRoleSwitch('admin')}
                className={`px-2 py-1 text-[11px] rounded ${currentUser?.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
