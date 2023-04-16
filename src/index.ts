import { Telegram } from "./telegram";
import { OpenAI } from "./openai";

export interface Env {
  OPENAI_API_KEY: string;
  OPENAI_CHAT_MODEL: string;
  OPENAI_CHAT_PROMPT: string;
  TELEGRAM_BOT_KEY: string;
  BOT_CONTEXT_KV: KVNamespace;
  BOT_CONTEXT_SIZE: number;
}

async function saveChatContext(
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

async function fetchChatContext(
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

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (
      request.cf?.asOrganization !== "Telegram Messenger Inc" ||
      !request.url.endsWith(env.TELEGRAM_BOT_KEY)
    ) {
      return new Response(null, {
        status: 401,
      });
    }
    const update: Telegram.Update = await request.json();
    console.log(JSON.stringify(update));

    const text =
      update.message?.text ||
      update.inline_query?.query ||
      update.chosen_inline_result?.query ||
      "";
    if (text.trim() == "") {
      return new Response(null);
    }

    const username =
      update.message?.from.username ||
      update.inline_query?.from.username ||
      update.chosen_inline_result?.from.username ||
      "user";

    const contextKey =
      update.message?.chat.id == undefined
        ? `tg_${username}_ctx`
        : `${update.message.chat.id}`;
    let context = await fetchChatContext(env, contextKey);
    context.push({ role: "user", content: text });

    if (update.message && !update.message.via_bot) {
      const reply = await OpenAI.chatCompletions(
        env.OPENAI_API_KEY,
        env.OPENAI_CHAT_MODEL,
        env.OPENAI_CHAT_PROMPT,
        `tg_${username}`,
        context
      );
      await saveChatContext(env, contextKey, context, reply);
      return Telegram.respondMessage(reply, update.message.chat.id);
    } else if (update.inline_query) {
      // send back whatever was typed for inline_query
      return Telegram.respondInlineQuery(text, update.inline_query.id);
    } else if (update.chosen_inline_result) {
      let newText = `*${username} said*: ` + text + "\n" + "*Bot says*: ";
      await Telegram.editInlineMessage(
        env.TELEGRAM_BOT_KEY,
        newText + "...",
        update.chosen_inline_result.inline_message_id
      );

      const reply = await OpenAI.chatCompletions(
        env.OPENAI_API_KEY,
        env.OPENAI_CHAT_MODEL,
        env.OPENAI_CHAT_PROMPT,
        `tg_${username}`,
        context
      );
      await saveChatContext(env, contextKey, context, reply);

      await Telegram.editInlineMessage(
        env.TELEGRAM_BOT_KEY,
        newText + reply,
        update.chosen_inline_result.inline_message_id
      );
    }

    return new Response(null);
  },
};
