import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAIProvider, getAssistantModel, getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

const MAX_PROMPT_CHARS = 4_000;
const MAX_OUTPUT_TOKENS = 500;

const SYSTEM_PROMPT =
  "You are The Green List assistant. Support transparency, education, reporting, moderation, and community safety. Never facilitate cannabis sales, delivery, ordering, or distribution.";

export async function GET() {
  const provider = getAIProvider();

  return NextResponse.json({
    configured: provider !== null,
    provider,
    model: provider ? getAssistantModel() : null,
    endpoint: "/api/ai",
    method: "POST",
    streaming: true,
    contentType: "text/plain; charset=utf-8",
  });
}

/**
 * Streams an assistant reply as plain text. Requires a signed-in user so that
 * anonymous traffic cannot spend AI credits; the model never mutates records.
 */
export async function POST(request: Request) {
  const openai = getOpenAIClient();

  if (!openai) {
    return NextResponse.json(
      { error: "AI service is not configured" },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof body === "object" && body !== null && "prompt" in body
      ? (body as { prompt?: unknown }).prompt
      : undefined;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { error: `Prompt exceeds ${MAX_PROMPT_CHARS} characters` },
      { status: 413 }
    );
  }

  const model = getAssistantModel();

  try {
    const completion = await openai.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      },
      { signal: request.signal }
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
          controller.close();
        } catch (error) {
          console.error("[api/ai] stream interrupted:", error instanceof Error ? error.message : error);
          controller.error(error);
        }
      },
      cancel() {
        completion.controller.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-AI-Model": model,
      },
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}

/**
 * Maps provider failures to statuses the client can act on without leaking
 * request details. Gateway responses: 401 bad key, 402 credits or budget
 * exhausted, 403 model not permitted, 429 rate limited, 5xx provider capacity.
 */
function aiErrorResponse(error: unknown) {
  const status = error instanceof OpenAI.APIError ? error.status : undefined;
  console.error("[api/ai] request failed:", status ?? "", error instanceof Error ? error.message : error);

  if (status === 401 || status === 403) {
    return NextResponse.json({ error: "AI service is not authorized for this model" }, { status: 503 });
  }
  if (status === 402) {
    return NextResponse.json({ error: "AI service budget exhausted" }, { status: 503 });
  }
  if (status === 429) {
    return NextResponse.json(
      { error: "AI service is rate limited, try again shortly" },
      { status: 429, headers: { "Retry-After": "10" } }
    );
  }
  return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
}
