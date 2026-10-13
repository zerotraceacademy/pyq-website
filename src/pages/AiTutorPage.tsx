import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Languages,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  GraduationCap,
} from 'lucide-react';
import { api } from '../lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiTutorPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello! I am your **PYQVerse Gemini AI Study Assistant**. 🎯\n\nI can explain previous year questions, derive tough formulas step-by-step, uncover hidden test traps, and create custom revision notes in both **English** and **Hinglish**.\n\nWhat topic or question are you tackling today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'english' | 'hinglish'>('english');
  const [examContext, setExamContext] = useState('JEE Main (Engineering)');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const suggestedPrompts = [
    "Explain King's Property in Definite Integrals with an example.",
    "Why does Pentan-2-one give positive iodoform test but Pentan-3-one does not?",
    "Derive linear acceleration for a solid sphere rolling without slipping.",
    "How does Peterson's algorithm guarantee Bounded Waiting in OS?",
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.chatWithAiTutor(textToSend, examContext, language);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: `Error connecting to AI Tutor: ${err.message || 'Please verify connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `Chat cleared! Ready for your next concept or PYQ breakdown.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">Gemini 3.8 Study Assistant</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">Online</span>
            </div>
            <p className="text-xs text-slate-500">Grounded in verified syllabus archives and past year questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Exam Context Selector */}
          <select
            value={examContext}
            onChange={(e) => setExamContext(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="JEE Main (Engineering)">Context: JEE Main</option>
            <option value="JEE Advanced (IIT Entrance)">Context: JEE Advanced</option>
            <option value="GATE Computer Science & IT">Context: GATE CS</option>
            <option value="NEET UG (Medical)">Context: NEET UG</option>
            <option value="CBSE Class 12 Boards">Context: CBSE 12</option>
          </select>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage((l) => (l === 'english' ? 'hinglish' : 'english'))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Toggle output language"
          >
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <span className="capitalize">{language}</span>
          </button>

          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Prompts Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium shrink-0">Try asking:</span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl text-slate-700 shrink-0 transition-colors shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 min-h-[480px] max-h-[600px] overflow-y-auto space-y-6 shadow-2xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-1.5 max-w-2xl ${isUser ? 'items-end' : ''}`}>
                <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                  <span>{isUser ? 'You' : 'Gemini AI Tutor'}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {!isUser && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-indigo-600 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot className="w-4 h-4" />
            </div>
            <div>Gemini 3.8 is generating your step-by-step educational breakdown...</div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-md focus-within:ring-2 focus-within:ring-indigo-500"
      >
        <input
          type="text"
          placeholder={`Ask about any PYQ concept, formula, or exam strategy in ${language}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
