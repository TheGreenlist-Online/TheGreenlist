import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    endpoint: "/api/ai",
    method: "POST",
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are The Green List assistant. Support transparency, education, reporting, moderation, and community safety. Never facilitate cannabis sales, delivery, ordering, or distribution.",
        },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      return NextResponse.json(
        { error: "AI service returned no response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("OpenAI API error:", error);

    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    );
  }
}
