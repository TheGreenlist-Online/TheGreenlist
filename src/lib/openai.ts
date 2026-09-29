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
