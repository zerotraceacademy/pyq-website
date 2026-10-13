import React, { useState, useEffect } from 'react';
import { User, Bookmark } from '../types';
import { api } from '../lib/api';
import { User as UserIcon, Shield, Bookmark as BookmarkIcon, Trash2, CheckCircle2 } from 'lucide-react';

interface ProfilePageProps {
  currentUser: User | null;
  onUserUpdated: (u: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUserUpdated }) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [targetExam, setTargetExam] = useState(currentUser?.targetExam || 'JEE Main');
  const [preferredLanguage, setPreferredLanguage] = useState(currentUser?.preferredLanguage || 'english');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setTargetExam(currentUser.targetExam);
      setPreferredLanguage(currentUser.preferredLanguage);
    }
    api.getBookmarks()
      .then((res) => setBookmarks(res.bookmarks))
      .catch((e) => console.error(e));
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({ name, targetExam, preferredLanguage });
      onUserUpdated(res.user);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      await api.removeBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Account Profile & Study Preferences
        </h1>
        <p className="text-xs text-slate-500">
          Configure personal exam target, preferred AI tutor language, and manage saved bookmarks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Form: Profile Settings (2 cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Authenticated account identifier</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Examination Focus</label>
              <input
                type="text"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Preferred AI Tutor Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="english">Academic English</option>
                <option value="hinglish">Conversational Hinglish (Hindi + English)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Bookmarks list (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookmarkIcon className="w-4 h-4 text-indigo-600" />
            <span>Saved Bookmarks ({bookmarks.length})</span>
          </h3>

          {bookmarks.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-6">No saved papers or questions yet.</div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 line-clamp-1">{b.title}</span>
                    <button
                      onClick={() => handleRemoveBookmark(b.id)}
                      className="text-slate-400 hover:text-rose-600 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500">{b.subtitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
