import OpenAI from "openai";

/**
 * Create the server-side OpenAI client only when a request needs it. Keeping
 * initialization out of module scope allows Vercel to build deployments where
 * the optional AI feature has not been configured yet.
 */
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export function getAIGatewayClient() {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_GATEWAY_BASE_URL?.trim() || "https://ai-gateway.vercel.sh/v1",
  });
}
