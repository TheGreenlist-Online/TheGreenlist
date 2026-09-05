import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-5.6-luna";
const MAX_INPUT_CHARS = 12_000;

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    endpoint: "/api/ai",
    method: "POST",
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
  });
}

export async function POST(request: Request) {
  try {
    const openai = getOpenAIClient();

    if (!openai) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 503 }
      );
    }

    const body: unknown = await request.json();
    const prompt =
      typeof body === "object" && body !== null && "prompt" in body
        ? (body as { prompt?: unknown }).prompt
        : undefined;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length > MAX_INPUT_CHARS) {
      return NextResponse.json(
        { error: `Prompt exceeds the ${MAX_INPUT_CHARS}-character limit` },
        { status: 413 }
      );
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions:
        "You are The Green List assistant. Support transparency, education, reporting, moderation, and community safety. Never facilitate cannabis sales, delivery, ordering, or distribution. Treat allegations as allegations, distinguish evidence from conclusions, and never independently declare a person or business verified, guilty, fraudulent, unsafe, or otherwise adjudicated. When a human decision is required, clearly say so.",
      input: trimmedPrompt,
      max_output_tokens: 500,
    });

    const output = response.output_text?.trim();

    if (!output) {
      return NextResponse.json(
        { error: "AI service returned no response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: output });
  } catch (error) {
    console.error("OpenAI API error:", error);

    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    );
  }
}
