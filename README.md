
# 🏛️ ReguFlow: India Compliance & Risk Assistant

**ReguFlow** is a specialized AI-driven platform designed to help businesses, startups, and freelancers navigate the complex regulatory landscape of India. By leveraging the **Gemini 3 Pro** engine, it converts legal jargon into actionable operational workflows.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase)
![Gemini AI](https://img.shields.io/badge/AI-Gemini_3_Pro-4285F4?logo=google-gemini)

## 🚀 Key Features

- **Scenario-to-Roadmap:** Input a business case (e.g., "Starting a fintech in Mumbai") and get a full regulatory sequence.
- **Interactive Checklists:** Track progress with a task-based workflow synced to your account.
- **The Vault:** Securely store and revisit all generated compliance roadmaps.
- **Document Stack:** Know exactly which forms (Form 16, GST-01, etc.) are required for your specific situation.
- **Export to PDF:** Professional formatting for offline review or board presentations.

## 🛠️ Tech Stack

- **Frontend:** React 19 (Hooks, Context), Tailwind CSS (UI/UX)
- **AI Engine:** Google Gemini 3 Pro (via @google/genai)
- **Database & Auth:** Supabase (PostgreSQL with RLS)
- **Build Tool:** Vite

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- A Google AI Studio API Key ([Get it here](https://aistudio.google.com/))
- A Supabase Project ([Create one here](https://supabase.com/))

### 2. Environment Variables
Create a `.env` file or set these in your deployment dashboard (Vercel/Netlify):
```env
API_KEY=your_gemini_api_key
```

### 3. Database Schema
Run the following in your Supabase SQL Editor:
```sql
create table roadmaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  scenario text not null,
  data jsonb not null,
  completed_tasks text[] default '{}',
  created_at timestamp with time zone default now()
);

alter table roadmaps enable row level security;
create policy "Users can manage their own roadmaps" on roadmaps for all using (auth.uid() = user_id);
```

## ⚖️ Disclaimer
This tool provides informational roadmaps based on standard Indian regulatory patterns. It is not a substitute for professional legal or financial counsel.
