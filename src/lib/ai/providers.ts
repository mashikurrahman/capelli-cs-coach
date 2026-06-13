type ChatProvider = 'groq' | 'cloudflare';
type EmbeddingProvider = 'cloudflare';

interface ChatRequest {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

const DEFAULT_GROQ_CHAT_MODEL = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
const DEFAULT_CLOUDFLARE_CHAT_MODEL = process.env.CLOUDFLARE_CHAT_MODEL ?? '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const DEFAULT_CLOUDFLARE_EMBEDDING_MODEL = process.env.CLOUDFLARE_EMBEDDING_MODEL ?? '@cf/baai/bge-base-en-v1.5';
const MAX_EMBED_CHARS = 8000;

export function resolveChatProvider(): ChatProvider {
  const explicit = normalizeProvider(process.env.AI_CHAT_PROVIDER ?? process.env.AI_PROVIDER);
  if (explicit === 'groq' || explicit === 'cloudflare') return explicit;
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) return 'cloudflare';
  return 'groq';
}

export function resolveEmbeddingProvider(): EmbeddingProvider {
  const explicit = normalizeProvider(process.env.AI_EMBEDDING_PROVIDER ?? process.env.AI_PROVIDER);
  if (explicit === 'cloudflare') return explicit;
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) return 'cloudflare';
  return 'cloudflare';
}

export function getChatModel(provider = resolveChatProvider()): string {
  if (provider === 'groq') return process.env.AI_CHAT_MODEL ?? DEFAULT_GROQ_CHAT_MODEL;
  return process.env.AI_CHAT_MODEL ?? DEFAULT_CLOUDFLARE_CHAT_MODEL;
}

export function getEmbeddingModel(): string {
  return process.env.AI_EMBEDDING_MODEL ?? DEFAULT_CLOUDFLARE_EMBEDDING_MODEL;
}

export async function generateText(request: ChatRequest): Promise<string> {
  const provider = resolveChatProvider();
  const model = request.model ?? getChatModel(provider);
  const messages = [
    ...(request.system ? [{ role: 'system' as const, content: request.system }] : []),
    { role: 'user' as const, content: request.prompt },
  ];

  const data = await postChatCompletion(provider, {
    model,
    messages,
    temperature: request.temperature ?? 0.15,
    max_tokens: request.maxOutputTokens ?? 8192,
  });

  // Some Cloudflare models auto-parse JSON-looking output into an object.
  // Normalize to a string so callers (incl. generateJson) get consistent text.
  let content = data.choices?.[0]?.message?.content;
  if (content && typeof content === 'object') content = JSON.stringify(content);
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`AI provider returned an empty response from ${provider}`);
  }
  return content.trim();
}

export async function generateJson<T = unknown>(request: ChatRequest): Promise<T> {
  const raw = await generateText(request);
  const jsonText = extractJsonText(raw);

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON from AI response: ${raw.slice(0, 400)}`);
  }
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const provider = resolveEmbeddingProvider();
  if (provider !== 'cloudflare') {
    throw new Error(`Unsupported embedding provider: ${provider}`);
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error('Cloudflare AI credentials are missing. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/embeddings`;
  const payload = {
    model: getEmbeddingModel(),
    input: texts.map(cleanEmbeddingInput),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await readJsonResponse(response, 'Cloudflare embeddings');
  const vectors = json.data?.map((item: { embedding?: number[] }) => item.embedding);
  if (!Array.isArray(vectors) || vectors.some((vec: unknown) => !Array.isArray(vec))) {
    throw new Error('Cloudflare embeddings response was malformed');
  }

  return vectors as number[][];
}

async function postChatCompletion(
  provider: ChatProvider,
  body: {
    model: string;
    messages: Array<{ role: 'system' | 'user'; content: string }>;
    temperature: number;
    max_tokens: number;
  }
): Promise<any> {
  const config = provider === 'groq'
    ? {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ''}`,
        },
      }
    : {
        url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN ?? ''}`,
        },
      };

  if (provider === 'groq' && !process.env.GROQ_API_KEY) {
    throw new Error('Groq API key is missing. Set GROQ_API_KEY in your .env file.');
  }

  if (provider === 'cloudflare' && (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN)) {
    throw new Error('Cloudflare AI credentials are missing. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse(response, `${provider} chat`);
}

async function readJsonResponse(response: Response, source: string): Promise<any> {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${source} request failed (${response.status}): ${text.slice(0, 500)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${source} returned non-JSON response: ${text.slice(0, 500)}`);
  }
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith('```')) {
    const inner = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
    if (inner) return inner;
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);

  return trimmed;
}

function cleanEmbeddingInput(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_EMBED_CHARS);
}

function normalizeProvider(value?: string | null): ChatProvider | EmbeddingProvider | null {
  const v = value?.trim().toLowerCase();
  if (v === 'groq' || v === 'cloudflare') return v;
  return null;
}
