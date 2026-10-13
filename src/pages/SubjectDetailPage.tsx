import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers, CheckCircle2, Flame, ArrowRight } from 'lucide-react';
import { Subject, Topic, Question } from '../types';
import { api } from '../lib/api';

export const SubjectDetailPage: React.FC = () => {
  const { subjectSlug } = useParams<{ subjectSlug: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectSlug) return;
    setLoading(true);
    api.getSubjectDetails(subjectSlug)
      .then((res) => {
        setSubject(res.subject);
        setTopics(res.topics);
        setQuestions(res.questions);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [subjectSlug]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">Loading subject details...</div>;
  }

  if (!subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Subject Not Found</h2>
        <Link to="/exams" className="text-sm font-semibold text-indigo-600 hover:underline">
          ← Return to examinations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to={`/exams`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>
      </div>

      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          {subject.examName} · {subject.code}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{subject.name}</h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{subject.description}</p>
        <div className="flex items-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div><span className="font-bold text-slate-900">{topics.length}</span> High-Yield Topics</div>
          <div><span className="font-bold text-slate-900">{questions.length}</span> Curated Practice Problems</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">High-Yield Topics & Historical Weightage</h2>
          <span className="text-xs text-slate-500">Derived from 2018–2024 verified papers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((t) => (
            <div
              key={t.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-500">{t.papersMapped} Papers Mapped</span>
                  <span
                    className={`font-semibold text-xs ${
                      t.frequencyScore === 'Very High'
                        ? 'text-rose-600'
                        : t.frequencyScore === 'High'
                        ? 'text-amber-600'
                        : 'text-slate-600'
                    }`}
                  >
                    Frequency: {t.frequencyScore}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">{t.questionsCount} Practice Questions</span>
                <Link
                  to={`/practice?topicId=${t.id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Start Practice Drill <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
