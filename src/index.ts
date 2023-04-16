import { Telegram } from "./telegram";
import { OpenAI } from "./openai";

export interface Env {
  OPENAI_API_KEY: string;
  OPENAI_CHAT_MODEL: string;
  OPENAI_CHAT_PROMPT: string;
  TELEGRAM_BOT_KEY: string;
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
      update.chosen_inline_result?.query;
    if (!text || text.trim() == "") {
      return new Response(null);
    }

    const username =
      update.message?.from.username ||
      update.inline_query?.from.username ||
      update.chosen_inline_result?.from.username;

    let context: OpenAI.Message[] = [{ role: "user", content: text }];
    if (update.message && !update.message.via_bot) {
      const reply = await OpenAI.chatCompletions(
        env.OPENAI_API_KEY,
        env.OPENAI_CHAT_MODEL,
        env.OPENAI_CHAT_PROMPT,
        `tg_${username}`,
        context
      );
      return Telegram.respondMessage(reply, update.message.chat.id);
    } else if (update.inline_query) {
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

      await Telegram.editInlineMessage(
        env.TELEGRAM_BOT_KEY,
        newText + reply,
        update.chosen_inline_result.inline_message_id
      );
    }

    return new Response(null);
  },
};