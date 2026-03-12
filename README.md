# 🇹🇷 Türkçe Learn

A complete Turkish learning app — A1 to B1, AI-powered, cloud synced.

## Features
- 28 structured lessons (vocab, grammar, dialogues, stories)
- 200+ vocabulary words across 9 categories
- 8 grammar lessons with examples
- 5 real dialogues
- 4 comprehensible input stories
- SM-2 Spaced Repetition flashcards
- Placement test (12 questions)
- Turkish pronunciation guide (29 letters)
- Google login + Supabase cloud sync
- Works as PWA (add to home screen)

## Deploy to Vercel
1. Push this repo to GitHub
2. Go to vercel.com → Import repo
3. Root Directory: leave blank
4. No environment variables needed (keys are baked in)
5. Deploy

## Add to Phone
Open your Vercel URL → Chrome menu → Add to Home Screen

## Supabase SQL (run once in SQL Editor)
```sql
CREATE TABLE IF NOT EXISTS progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT, level TEXT DEFAULT 'a1',
  xp INT DEFAULT 0, streak INT DEFAULT 0,
  last_active TEXT, completed JSONB DEFAULT '[]',
  srs JSONB DEFAULT '{}', updated_at TIMESTAMPTZ
);
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON progress
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Supabase Auth Setup
1. Supabase → Authentication → Providers → Enable Google
2. Authentication → URL Configuration → add your Vercel URL to Redirect URLs
