# Nova AI ✨

A futuristic, responsive AI workspace built with Next.js, React, TypeScript, and the OpenAI Responses API.

## Features

- Polished dark and light themes
- Responsive desktop and mobile layout
- Conversation history saved in the current browser
- Multiple model choices (Nova Quick, Nova Think, Nova Lite)
- Coding Studio mode
- Optional web search through OpenAI's Responses API
- Text and code file attachments (up to 4 per prompt; text files are read locally)
- Browser speech-to-text input where supported
- Read-aloud responses where supported
- Markdown, tables, and syntax-friendly code blocks
- Server-side API route so the OpenAI key is never exposed in client code

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Add a valid OpenAI API key to `OPENAI_API_KEY`
5. Run `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel

1. Import `https://github.com/treatwashere/nova-ai` into Vercel.
2. Keep the framework preset as **Next.js** and the root directory as the repository root.
3. Add `OPENAI_API_KEY` under **Project → Settings → Environment Variables** for Preview and Production.
4. Deploy. Later commits to `main` will trigger deployments automatically when Git integration is enabled.

## Important notes

- OpenAI API usage may incur charges; a ChatGPT subscription does not include API credits.
- Never commit real API keys to GitHub. Keep them in local environment files or Vercel environment variables.
- Browser history is stored locally on the device and is not synced across devices.
- Voice input depends on browser speech-recognition support. Read-aloud uses the browser's speech synthesis.
- File text extraction is enabled for common text/code formats. Other file types are listed but not parsed yet.
- Web search is optional and requires a model/API configuration that supports the Responses API web search tool.
- Account sign-in and cloud-synced conversation history are not enabled in this first version; the Supabase variables are placeholders for a future auth integration.

## Stack

Next.js · React · TypeScript · OpenAI Responses API · React Markdown · Lucide
