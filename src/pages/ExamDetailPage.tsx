import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  FileText,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Download,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Exam, Subject, QuestionPaper } from '../types';
import { api } from '../lib/api';

export const ExamDetailPage: React.FC = () => {
  const { examSlug } = useParams<{ examSlug: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examSlug) return;
    setLoading(false);
    api.getExamDetails(examSlug)
      .then((res) => {
        setExam(res.exam);
        setSubjects(res.subjects);
        setPapers(res.papers);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [examSlug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading examination details...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Examination Not Found</h2>
        <Link to="/exams" className="text-sm font-semibold text-indigo-600 hover:underline">
          ← Return to examinations catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/exams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 uppercase tracking-wider">{exam.category}</span>
              <span>·</span>
              <span>Conducting Body: {exam.conductingBody}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {exam.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/practice?examId=${exam.id}`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Practice Exam Questions
            </Link>
            <Link
              to="/mock-tests"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
            >
              Take Mock Test
            </Link>
          </div>
        </div>

        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {exam.description}
        </p>

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div>
            <span className="font-bold text-slate-900">{exam.totalPapers}</span> Published Papers
          </div>
          <div>
            <span className="font-bold text-slate-900">{exam.totalQuestions}+</span> Mapped Questions
          </div>
          <div>
            <span className="font-bold text-slate-900">{exam.subjects.length}</span> Core Disciplines
          </div>
        </div>
      </div>

      {/* Subjects in Exam */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Syllabus Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <Link
              key={sub.id}
              to={`/subjects/${sub.slug}`}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-indigo-600 font-semibold">{sub.code}</span>
                <span>{sub.topicsCount} Topics</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{sub.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Available Question Papers */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Previous Year Question Papers</h2>
        {papers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            No papers found for this examination yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{paper.year} · {paper.session}</span>
                    {paper.verifiedSolutionAvailable && (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Keys
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/papers/${paper.slug}`}
                    className="font-bold text-slate-900 hover:text-indigo-600 text-base"
                  >
                    {paper.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{paper.durationMinutes} mins</span>
                    <span>Max Marks: {paper.maxMarks}</span>
                    <span>{paper.language}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{paper.downloadsCount.toLocaleString()} downloads</span>
                  <div className="flex gap-2">
                    <Link
                      to={`/papers/${paper.slug}`}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
