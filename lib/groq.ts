import Groq from "groq-sdk";

export const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const WHISPER_MODEL = "whisper-large-v3";

export function createGroqClient(apiKey: string): Groq {
  return new Groq({ apiKey });
}
