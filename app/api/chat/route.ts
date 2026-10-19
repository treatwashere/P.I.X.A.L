import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "P.I.X.A.L. needs an OpenAI API key. Add OPENAI_API_KEY in Vercel Environment Variables, then redeploy." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const messages = body.messages as IncomingMessage[];
    const webSearch = Boolean(body.webSearch);
    const generateImage = Boolean(body.generateImage);
    const mode = body.mode === "code" ? "code" : "chat";

    if (!Array.isArray(messages) || !messages.length) {
      return NextResponse.json({ error: "Send a message to get started." }, { status: 400 });
    }
    if (messages.length > 80) {
      return NextResponse.json({ error: "This conversation is getting long. Start a new chat to continue." }, { status: 400 });
    }

    const input = messages.slice(-30).map((m) => ({
      role: m.role,
      content: String(m.content || "").slice(0, 20000),
    }));
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const tools: Array<Record<string, unknown>> = [];
    if (webSearch) {
      tools.push({
        type: "web_search",
        search_context_size: "medium",
        user_location: {
          type: "approximate",
          country: "GB",
          timezone: "Europe/London",
        },
      });
    }
    if (generateImage) {
      tools.push({
        type: "image_generation",
        model: "chatgpt-image-latest",
        size: "auto",
        quality: "auto",
        output_format: "png",
      });
    }

    const response = await client.responses.create({
      prompt: {
        id: "pmpt_6ad64e62a094819595bd0f084829af620c5d77df71e015e0",
        version: "1",
      },
      reasoning: { mode: "pro", summary: "auto" },
      input,
      ...(tools.length ? { tools: tools as never } : {}),
      include: ["web_search_call.action.sources"],
      store: true,
    });

    const imageCall = response.output.find(
      (item) => item.type === "image_generation_call" && "result" in item && typeof item.result === "string"
    );
    const imageData = imageCall && "result" in imageCall && typeof imageCall.result === "string"
      ? imageCall.result
      : null;

    const answer = response.output_text || (imageData
      ? "Here's the image I created for you."
      : "I couldn't generate a response. Please try again.");

    return NextResponse.json({ answer, imageData });
  } catch (error) {
    console.error("P.I.X.A.L. chat API error:", error);
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    if (message.toLowerCase().includes("api key") || message.toLowerCase().includes("authentication")) {
      return NextResponse.json(
        { error: "OpenAI authentication failed. Check the OPENAI_API_KEY configured for this project." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "P.I.X.A.L. couldn't complete that request. Check the API configuration and try again." },
      { status: 500 }
    );
  }
}