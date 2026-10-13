# PYQVerse - Intelligent AI-Powered Previous Year Questions Platform

> **"Prepare Smarter. Practice Better. Achieve More."**

PYQVerse is an educational web platform for Previous Year Questions (PYQs), real computer-based exam preparation, timed mock simulations, student analytics, and Gemini AI-powered learning.

---

## 🚀 Key Capabilities & Features

### 1. Curated PYQ Vault & Faceted Exploration
- **Real Exam Catalog**: JEE Main, JEE Advanced, NEET UG, GATE CS, CBSE Class 12, AKTU B.Tech.
- **Search & Filter**: Multi-attribute filtering across examination, conducting body (NTA, IITs, IISc, CBSE), year (2018–2024), paper type, and shift.
- **Verified Solutions**: Step-by-step mathematical and conceptual solutions with pitfall alerts.
- **Private Cloud Storage**: Integrated with Cloudflare R2 object storage with server-generated signed URLs.

### 2. High-Stakes Exam Simulator
- **CBT Interface**: Timed examination environment matching official NTA/GATE exam simulators.
- **Server-Authoritative**: Real-time timer countdown, automatic periodic autosave, and server-side scoring.
- **Negative Marking**: Configurable rules (e.g. +4 / -1 or +1 / -0.33).
- **Question Palette**: Interactive status indicators for Answered, Unanswered, Marked for Review, and Answered & Marked.

### 3. Automated Mistake Notebook
- Automatically captures every incorrect answer during mock tests or practice drills.
- Displays what you answered vs. the official verified answer.
- Personal note-taking for conceptual takeaways.
- Resolution tracking: `Unresolved` → `Reviewing` → `Mastered`.

### 4. Gemini 3.8 AI Study Assistant
- **Bilingual Tutoring**: Choose between academic **English** or student-friendly conversational **Hinglish**.
- **Deep Concept Breakdown**: Unpacks questions into Core Concept, Step-by-Step Derivation, Common Traps, and High-Speed Shortcuts.
- **Dedicated Chatroom**: Multi-turn dialogue with past exam context.

### 5. Performance Analytics & Diagnostic Suite
- Calculated directly from real submitted student attempts:
  - Overall accuracy percentage
  - Subject-by-subject accuracy bars (Physics, Chemistry, Mathematics)
  - Speed per question metrics
  - Mistake resolution rates
  - High-yield topic weightage derived from 2018–2024 papers

### 6. Personalized Study Planner
- Target exam countdown tracker.
- Daily study bandwidth calculator.
- Priority revision tasks with checkable completion states.

### 7. Administrative Command Console (`/admin`)
- Paper metadata management with SHA-256 checksum tracking.
- Google Sheets & Google Apps Script bridge with dry-run preview and batch synchronization.
- Cloudflare R2 bucket connectivity inspector.
- Administrative audit logs trail.
- System diagnostics & health checks.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons.
- **Full-Stack Runtime (AI Studio)**: Express full-stack engine (`server.ts`) with Vite middlewares, real REST APIs under `/api/v1/*`, and disk persistence.
- **Python Backend**: FastAPI application in `/backend/app/` with Motor, Pydantic v2, and unified AI provider abstraction.
- **AI Service**: Google GenAI TypeScript SDK (`@google/genai`) using `gemini-3.8-flash` on server-side proxy routes with User-Agent telemetry.
- **Storage**: Cloudflare R2 S3-compatible private buckets.
- **Secondary Sync**: Google Apps Script Web App (`google-apps-script/Code.gs`).

---

## 🧪 Testing

Run linting and test verification:
```bash
npm run lint
```
