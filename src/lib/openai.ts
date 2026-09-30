import OpenAI from "openai";

/**
 * Server-side AI client.
 *
 * Requests go through Vercel AI Gateway when AI_GATEWAY_API_KEY is set. The
 * gateway speaks the OpenAI Chat Completions protocol, so the existing `openai`
 * SDK is reused with a different base URL and `provider/model` model IDs
 * (see https://ai-gateway.vercel.sh/v1/models). When only OPENAI_API_KEY is
 * set, the client talks to OpenAI directly with the plain model name, so an
 * environment that has not adopted the gateway keeps working unchanged.
 *
 * The client is created per request rather than at module scope so Vercel can
 * build deployments where the optional AI feature has not been configured.
 */

export const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

/** Default model for interactive assistant responses (gateway ID). */
export const DEFAULT_AI_GATEWAY_MODEL = "openai/gpt-6-astra";

/** Compact model for high-volume background summarization. */
export const DEFAULT_AI_SUMMARY_MODEL = "openai/gpt-4o-mini";

export type AIProvider = "ai-gateway" | "openai";

export type AIModelOptions = {
  /** Gateway `provider/model` ID, used when routing through AI Gateway. */
  readonly gateway: string;
  /** Direct OpenAI model name, used when only OPENAI_API_KEY is configured. */
  readonly direct: string;
};

export function getAIProvider(): AIProvider | null {
  if (process.env.AI_GATEWAY_API_KEY?.trim()) return "ai-gateway";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

export function isAIConfigured(): boolean {
  return getAIProvider() !== null;
}

/**
 * Returns an OpenAI-compatible client for the configured provider, or null when
 * the AI feature is not configured. Callers must degrade gracefully on null.
 */
export function getOpenAIClient(): OpenAI | null {
  const provider = getAIProvider();

  if (provider === "ai-gateway") {
    return new OpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY!.trim(),
      baseURL: process.env.AI_GATEWAY_BASE_URL?.trim() || AI_GATEWAY_BASE_URL,
    });
  }

  if (provider === "openai") {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY!.trim() });
  }

  return null;
}

/**
 * Picks the model ID for the active provider. Gateway IDs are explicit
 * `provider/model` strings; they are never derived by prefixing a direct name.
 */
export function resolveAIModel(options: AIModelOptions): string {
  return getAIProvider() === "ai-gateway" ? options.gateway : options.direct;
}

/** Model used by the interactive `/api/ai` assistant route. */
export function getAssistantModel(): string {
  return resolveAIModel({
    gateway: process.env.AI_GATEWAY_MODEL?.trim() || DEFAULT_AI_GATEWAY_MODEL,
    direct: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  });
}

/** Model used by background news summarization. */
export function getSummaryModel(): string {
  return resolveAIModel({
    gateway: process.env.AI_GATEWAY_SUMMARY_MODEL?.trim() || DEFAULT_AI_SUMMARY_MODEL,
    direct: process.env.OPENAI_SUMMARY_MODEL?.trim() || "gpt-4o-mini",
  });
}
