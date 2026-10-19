# P.I.X.A.L. AI

A responsive AI assistant built with Next.js, React, TypeScript, and the OpenAI API.

## Features
- ChatGPT-style landing screen and responsive conversation workspace
- Multiple model choices, Markdown answers, code blocks, tables, and copy controls
- Coding Studio mode and optional web search
- Browser-based conversation history and dark/light appearance
- Text-file attachments, voice dictation, and read-aloud responses
- Server-side API route so the OpenAI key is not exposed to the browser

## Run locally
1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` to your own key.
4. Run `npm run dev` and open `http://localhost:3000`.

## Deploy
Deploy as a Next.js project on Vercel. Add `OPENAI_API_KEY` in Project Settings → Environment Variables and redeploy. Never commit a real API key.

## Current limitations
- Chat history is stored in the current browser; cloud sync and user accounts are not configured.
- Attachments extract text from supported text/code formats; PDFs and images are not yet parsed.
- Model choices require a valid OpenAI API key and API usage may incur charges.
