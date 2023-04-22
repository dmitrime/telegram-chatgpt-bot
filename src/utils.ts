import { OpenAI } from "./openai";

export namespace Utils {
  export async function savePicturePrompt(
    env: Env,
    prompt: string,
    keys: string[],
    user: string
  ) {
    if (env.BOT_IMAGE_PROMPTS_KV && prompt.trim() != "") {
      const date = new Date().toISOString();
      await env.BOT_IMAGE_PROMPTS_KV.put(
        prompt,
        JSON.stringify({ user, keys, date }).replaceAll("\\n", "")
      );
    }
  }

  export async function saveChatContext(
    env: Env,
    contextKey: string,
    context: OpenAI.Message[],
    text: string
  ) {
    if (context && context.length >= 1) {
      // remove the system prompt
      context.shift();
      // forget earlier context, if it's already large enough
      if (2 * env.BOT_CONTEXT_SIZE < context.length) {
        context.splice(0, 2);
      }
      // add the latest reply
      context.push({ role: "assistant", content: text });

      if (env.BOT_CONTEXT_KV && contextKey.trim() != "") {
        await env.BOT_CONTEXT_KV.put(
          contextKey,
          JSON.stringify(context).replaceAll("\\n", "")
        );
      }
    }
  }

  export async function fetchChatContext(
    env: Env,
    contextKey: string
  ): OpenAI.Message[] {
    let context: OpenAI.Message[] = [];

    if (
      env.BOT_CONTEXT_KV &&
      env.BOT_CONTEXT_SIZE &&
      env.BOT_CONTEXT_SIZE > 0 &&
      contextKey.trim() != ""
    ) {
      context =
        (await env.BOT_CONTEXT_KV.get(contextKey, {
          type: "json",
        })) || [];
    }

    return context;
  }
}
