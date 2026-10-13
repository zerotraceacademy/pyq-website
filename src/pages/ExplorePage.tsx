import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  X,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { QuestionPaper, Exam } from '../types';
import { api } from '../lib/api';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadModal, setDownloadModal] = useState<{
    open: boolean;
    paper?: QuestionPaper;
    signedUrl?: string;
    loading: boolean;
  }>({ open: false, loading: false });

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Filter states from URL or defaults
  const search = searchParams.get('search') || '';
  const selectedExam = searchParams.get('examId') || '';
  const selectedYear = searchParams.get('year') || '';
  const selectedType = searchParams.get('paperType') || '';

  const years = [2024, 2023, 2022, 2021, 2020, 2019];
  const paperTypes = ['Official Exam', 'Sample Paper', 'Pre-Board', 'Semester Main'];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPapers({
        examId: selectedExam || undefined,
        year: selectedYear || undefined,
        search: search || undefined,
        paperType: selectedType || undefined,
      }),
      api.getExams(),
      api.getBookmarks(),
    ])
      .then(([papersRes, examsRes, bookmarksRes]) => {
        setPapers(papersRes.papers);
        setExams(examsRes.exams);
        const bSet = new Set(bookmarksRes.bookmarks.map((b) => b.itemId));
        setBookmarkedIds(bSet);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedExam, selectedYear, search, selectedType]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleDownloadClick = async (paper: QuestionPaper) => {
    setDownloadModal({ open: true, paper, loading: true });
    try {
      const res = await api.getPaperDownloadUrl(paper.id);
      setDownloadModal({
        open: true,
        paper,
        signedUrl: res.downloadUrl,
        loading: false,
      });
    } catch (err) {
      console.error('Download error:', err);
      setDownloadModal({ open: true, paper, loading: false });
    }
  };

  const handleToggleBookmark = async (paper: QuestionPaper) => {
    try {
      if (bookmarkedIds.has(paper.id)) {
        // find bookmark id
        const allBm = await api.getBookmarks();
        const found = allBm.bookmarks.find((b) => b.itemId === paper.id);
        if (found) {
          await api.removeBookmark(found.id);
          const nextSet = new Set(bookmarkedIds);
          nextSet.delete(paper.id);
          setBookmarkedIds(nextSet);
        }
      } else {
        await api.addBookmark({
          itemType: 'paper',
          itemId: paper.id,
          title: paper.title,
          subtitle: `${paper.examName} · ${paper.year}`,
          notes: 'Saved for revision from Explore catalog.',
        });
        const nextSet = new Set(bookmarkedIds);
        nextSet.add(paper.id);
        setBookmarkedIds(nextSet);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const hasActiveFilters = Boolean(search || selectedExam || selectedYear || selectedType);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Previous Year Questions Library
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Search, filter, preview and download official question papers. All papers feature high-resolution scanned or digital PDFs stored in Cloudflare R2 with verified solution keys.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search papers by exam, shift, topic, or keyword..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button
              onClick={() => updateParam('search', '')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Exam Filter */}
          <select
            value={selectedExam}
            onChange={(e) => updateParam('examId', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => updateParam('year', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          {/* Paper Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => updateParam('paperType', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Paper Types</option>
            {paperTypes.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-medium">
            Found <span className="font-bold text-slate-900">{papers.length}</span> papers
          </div>
        </div>
      </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-6 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No question papers match your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, year, or examination criteria to see available verified papers.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {papers.map((paper) => {
            const isBookmarked = bookmarkedIds.has(paper.id);
            return (
              <div
                key={paper.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  {/* Meta row */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{paper.examName}</span>
                      <span>·</span>
                      <span>{paper.year}</span>
                      <span>·</span>
                      <span>{paper.session}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {paper.verifiedSolutionAvailable && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleBookmark(paper)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isBookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <Link
                    to={`/papers/${paper.slug}`}
                    className="block text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors leading-snug"
                  >
                    {paper.title}
                  </Link>

                  {/* Badges / Information */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {paper.durationMinutes} mins
                    </span>
                    <span>Max Marks: {paper.maxMarks}</span>
                    <span>Language: {paper.language}</span>
                    <span>{paper.paperType}</span>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="text-slate-400 flex items-center gap-2">
                    <span>{(paper.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {paper.viewsCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadClick(paper)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download PDF</span>
                    </button>

                    <Link
                      to={`/papers/${paper.slug}`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      View & Solve
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* R2 Signed Download Modal */}
      {downloadModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Authorized Cloudflare R2 Download</span>
              </h3>
              <button
                onClick={() => setDownloadModal({ open: false, loading: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-semibold text-slate-800">{downloadModal.paper?.title}</div>
                <div className="text-slate-500">
                  Exam: {downloadModal.paper?.examName} · Year: {downloadModal.paper?.year}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <p>🔒 <strong>Signed S3 URL:</strong> Generated with 15-minute token authorization.</p>
                <p>⚡ <strong>Edge CDN:</strong> Fast multi-region download from Cloudflare R2 object vault.</p>
              </div>

              {downloadModal.loading ? (
                <div className="text-center py-4 text-slate-500 font-medium animate-pulse">
                  Generating authenticated download signature...
                </div>
              ) : downloadModal.signedUrl ? (
                <div className="pt-2 space-y-2">
                  <a
                    href={downloadModal.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF ({(downloadModal.paper?.fileSizeBytes ? downloadModal.paper.fileSizeBytes / (1024 * 1024) : 3.2).toFixed(1)} MB)</span>
                  </a>
                  <p className="text-[10px] text-center text-slate-400 truncate">
                    Object Key: {downloadModal.paper?.r2ObjectKey}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
