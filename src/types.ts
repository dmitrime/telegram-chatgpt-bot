export interface Message {
  role: string;
  content: string;
}

export interface Env {
  TELEGRAM_BOT_KEY: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string
  STABILITY_API_KEY: string;
  R2_BUCKET: R2Bucket;
  R2_DEV_PUBLIC: string;
  BOT_IMAGE_PROMPTS_KV: KVNamespace;
  BOT_CONTEXT_KV: KVNamespace;
  BOT_CONTEXT_SIZE: number;
}