export {
  embedText,
  embedTexts,
  generateJson,
  generateText,
  getChatModel,
  getEmbeddingModel,
  resolveChatProvider,
  resolveEmbeddingProvider,
} from './providers';

export const CHAT_MODEL = process.env.AI_CHAT_MODEL;
export const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL;
export const EMBEDDING_DIM = 768;
