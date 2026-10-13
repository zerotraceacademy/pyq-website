import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Eye,
  FileCheck2,
  X,
  Share2,
  Check,
} from 'lucide-react';
import { QuestionPaper, Question } from '../types';
import { api } from '../lib/api';

export const PaperDetailPage: React.FC = () => {
  const { paperSlug } = useParams<{ paperSlug: string }>();
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'pdf_preview'>('questions');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (!paperSlug) return;
    setLoading(true);
    api.getPaperDetails(paperSlug)
      .then((res) => {
        setPaper(res.paper);
        setQuestions(res.questions);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [paperSlug]);

  const handleDownload = async () => {
    if (!paper) return;
    setDownloadLoading(true);
    try {
      const res = await api.getPaperDownloadUrl(paper.id);
      window.open(res.downloadUrl, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">Loading question paper...</div>;
  }

  if (!paper) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Question Paper Not Found</h2>
        <Link to="/explore" className="text-sm font-semibold text-indigo-600 hover:underline">
          ← Return to Explore Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Question Papers</span>
        </Link>
      </div>

      {/* Paper Header Banner */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 uppercase tracking-wider">{paper.examName}</span>
              <span>·</span>
              <span>{paper.year}</span>
              <span>·</span>
              <span>{paper.session}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {paper.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
              title="Copy share link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{downloadLoading ? 'Signing URL...' : 'Download Official PDF'}</span>
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs"
              title="Report issue in paper"
            >
              <AlertTriangle className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            Duration: {paper.durationMinutes} mins
          </span>
          <span>Max Marks: {paper.maxMarks}</span>
          <span>Language: {paper.language}</span>
          <span>Institution: {paper.institution}</span>
          {paper.verifiedSolutionAvailable && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> 100% Verified Answer Key
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'questions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Structured Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('pdf_preview')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'pdf_preview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Official PDF Viewer
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'questions' ? (
        <div className="space-y-6">
          {questions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              Questions for this paper are being structured by content editors. You can view or download the full official PDF directly.
            </div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Question {idx + 1}</span>
                    <span>·</span>
                    <span>{q.subjectName}</span>
                    <span>·</span>
                    <span>{q.topicName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-600">Marks: +{q.marks} / -{q.negativeMarks}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                      {q.difficulty}
                    </span>
                  </div>
                </div>

                <div className="text-base font-semibold text-slate-900 leading-relaxed">
                  {q.questionText}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {q.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                        opt.key === q.correctAnswer
                          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950 font-semibold'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {opt.key}
                      </span>
                      <span>{opt.text}</span>
                      {opt.key === q.correctAnswer && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-700 uppercase">Correct</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Verified Solution */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Solution Breakdown</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700 font-mono">
                    <div className="font-bold text-slate-900">{q.verifiedSolution.finalAnswer}</div>
                    <ul className="list-decimal pl-4 space-y-1 font-sans text-slate-600 text-xs">
                      {q.verifiedSolution.stepByStep.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-indigo-50/60 p-3 rounded-xl space-y-1">
                    <div className="font-semibold text-indigo-900">💡 Key Concept:</div>
                    <p className="text-indigo-800">{q.verifiedSolution.keyConcept}</p>
                    <div className="font-semibold text-amber-800 pt-1">⚠️ Common Mistake:</div>
                    <p className="text-amber-800">{q.verifiedSolution.commonMistakes}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* PDF Preview Simulated Viewer */
        <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <span className="font-mono">{paper.r2ObjectKey}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>PDF · {(paper.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
              <button
                onClick={handleDownload}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
              >
                Download PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center text-center space-y-4">
            <FileText className="w-16 h-16 text-indigo-400" />
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-bold text-white">{paper.title}</h3>
              <p className="text-xs text-slate-400">
                Official high-resolution question paper document with digital typography and watermarking.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Open Complete Document in New Window
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Report Problem in Paper</span>
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Report Submitted to Editorial Review</h4>
                <p className="text-xs text-slate-500">
                  Thank you! Our subject matter experts review all flags within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportSuccess(false);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setReportSuccess(true);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Type</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                    <option value="typo">Typo or formatting error</option>
                    <option value="incorrect_answer">Ambiguity in answer key</option>
                    <option value="missing_diagram">Missing or blurred diagram</option>
                    <option value="poor_resolution">Low PDF scan resolution</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe question number and specific discrepancy..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
