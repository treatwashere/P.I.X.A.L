import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "P.I.X.A.L. needs an OpenAI API key. Add OPENAI_API_KEY in your Vercel project Environment Variables, then redeploy." }, { status: 503 });
    }
    const body = await request.json();
    const messages = body.messages as IncomingMessage[];
    const model = typeof body.model === "string" ? body.model : "gpt-4.1-mini";
    const mode = body.mode === "code" ? "code" : "chat";
    const webSearch = Boolean(body.webSearch);
    if (!Array.isArray(messages) || !messages.length) return NextResponse.json({ error: "Send a message to get started." }, { status: 400 });
    if (messages.length > 80) return NextResponse.json({ error: "This conversation is getting long. Start a new chat to continue." }, { status: 400 });
    const allowedModels = new Set(["gpt-4.1-mini", "gpt-4.1", "gpt-4.1-nano"]);
    const chosenModel = allowedModels.has(model) ? model : "gpt-4.1-mini";
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const input = messages.slice(-30).map(m => ({
      role: m.role,
      content: String(m.content || "").slice(0, 20000)
    }));
    const response = await client.responses.create({
      model: chosenModel,
      instructions: mode === "code"
        ? "You are P.I.X.A.L., a helpful expert software engineer. Explain decisions clearly, provide complete working code when requested, point out filenames and setup steps, and never expose secrets."
        : "You are P.I.X.A.L., a warm, thoughtful, capable AI assistant. Be accurate, useful, clear, and honest about uncertainty. Format answers with Markdown when helpful.",
      input,
      ...(webSearch ? { tools: [{ type: "web_search_preview" as const }] } : {}),
    });
    return NextResponse.json({ answer: response.output_text || "I couldn't generate a text response. Please try again." });
  } catch (error) {
    console.error("P.I.X.A.L. chat API error:", error);
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    if (message.toLowerCase().includes("api key") || message.toLowerCase().includes("authentication")) {
      return NextResponse.json({ error: "OpenAI authentication failed. Check the OPENAI_API_KEY configured for this project." }, { status: 401 });
    }
    return NextResponse.json({ error: "P.I.X.A.L. couldn't complete that request. Check the API configuration and try again." }, { status: 500 });
  }
}