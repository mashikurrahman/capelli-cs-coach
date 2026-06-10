import { GoogleGenerativeAI } from '@google/generative-ai';

const globalForGemini = globalThis as unknown as { gemini: GoogleGenerativeAI };

export const gemini =
  globalForGemini.gemini ||
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

if (process.env.NODE_ENV !== 'production') globalForGemini.gemini = gemini;

export const MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
export const EMBEDDING_MODEL = 'text-embedding-004';
export const EMBEDDING_DIM = 768;
