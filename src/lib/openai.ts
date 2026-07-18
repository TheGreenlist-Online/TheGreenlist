import OpenAI from "openai";

/**
 * Server-side OpenAI client for The Green List.
 * Requires OPENAI_API_KEY in the deployment environment.
 */

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not configured.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
