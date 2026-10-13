import React, { useState } from 'react';
import { Mail, CheckCircle2, Shield, FileText } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
    <div className="space-y-2 border-b border-slate-200 pb-4">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Effective Date: October 2026 · PYQVerse Platform</p>
    </div>
    <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
      <p>
        At PYQVerse, we respect student privacy and practice transparency in how data is utilized for personalized learning and examination diagnostics.
      </p>
      <h3 className="text-base font-bold text-slate-900 pt-2">1. Information We Collect</h3>
      <p>
        We collect student profile metadata (name, target exam, language preference) and exam performance data (scores, accuracy, time spent per question, mistake entries).
      </p>
      <h3 className="text-base font-bold text-slate-900 pt-2">2. How Data is Used</h3>
      <p>
        Performance data is processed strictly to calculate diagnostic analytics, generate personalized revision plans, and power targeted Gemini AI tutor explanations. We do not sell student data.
      </p>
      <h3 className="text-base font-bold text-slate-900 pt-2">3. Storage & Security</h3>
      <p>
        Data is safely persisted in MongoDB Atlas document stores and Cloudflare R2 encrypted private buckets using secure HTTPS and access controls.
      </p>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
    <div className="space-y-2 border-b border-slate-200 pb-4">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
      <p className="text-xs text-slate-500">Effective Date: October 2026 · PYQVerse Platform</p>
    </div>
    <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
      <p>
        Welcome to PYQVerse. By accessing this platform, you agree to comply with and be bound by the following terms of use.
      </p>
      <h3 className="text-base font-bold text-slate-900 pt-2">1. Educational Fair Use</h3>
      <p>
        Previous year question papers belong to their respective conducting bodies (NTA, IITs, IISc, CBSE). PYQVerse makes these archives accessible strictly for non-commercial educational practice, research, and revision.
      </p>
      <h3 className="text-base font-bold text-slate-900 pt-2">2. Exam Simulator Integrity</h3>
      <p>
        Our timed mock simulator runs server-authoritative scoring. Attempt data and answer evaluations are generated for personal preparation and do not constitute official admission rankings.
      </p>
    </div>
  </div>
);

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Contact & Support</h1>
        <p className="text-xs text-slate-500">Have a question or request for a new exam archive? Let us know!</p>
      </div>

      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-2xs">
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Message Received!</h3>
            <p className="text-xs text-slate-500">
              Our academic support team will respond within 24 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Name</label>
              <input required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input required type="email" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject</label>
              <input required type="text" placeholder="e.g. Request 2024 Shift 2 Paper addition" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Message</label>
              <textarea rows={4} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
