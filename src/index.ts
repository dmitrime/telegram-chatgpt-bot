import { Telegram } from "./telegram";
import { OpenAI } from "./openai";
import { Claude } from "./claude";
import { StabilityAI } from "./stability";
import { Utils } from "./utils";
import { Env } from "./types";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (!request.cf?.asOrganization.startsWith("Telegram Messenger")) {
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
    const tg_user = `tg_${username}`;

    const contextKey =
      update.message?.chat.id == undefined
        ? `${tg_user}_ctx`
        : `${tg_user}_${update.message.chat.id}_ctx`;
    let context = await Utils.fetchChatContext(env, contextKey);
    context.push({ role: "user", content: text });

    if (update.message && !update.message.via_bot) {
      if (text.startsWith("/generate")) {
        const prompt = text.slice("/generate".length).trim();
        if (prompt.trim() == "") {
          return new Response(null);
        }
        try {
          let keys = (
            await StabilityAI.generatePictures(
              env.STABILITY_API_KEY,
              env.R2_BUCKET,
              prompt,
              tg_user
            )
          ).map((key) => `${env.R2_DEV_PUBLIC}/${key}`);
          if (keys.length == 0) {
            throw new Error("empty keys returned");
          }
          console.log(keys[0]);
          await Utils.savePicturePrompt(env, prompt, keys, tg_user);
          return Telegram.sendPhoto(
            env.TELEGRAM_BOT_KEY,
            keys[0],
            update.message.chat.id
          );
        } catch (error) {
          return Telegram.respondMessage(
            "Oops, something went wrong...\n" + error,
            update.message.chat.id
          );
          return new Response(null);
        }
      } else {
        // const reply = await OpenAI.chatCompletions( env.OPENAI_API_KEY, context);
        const reply = await Claude.chatCompletions( env.ANTHROPIC_API_KEY, context);
        await Utils.saveChatContext(env, contextKey, context, reply);
        return Telegram.respondMessage(reply, update.message.chat.id);
      }
    } else if (update.inline_query) {
      // send back whatever was typed for inline_query
      return Telegram.respondInlineQuery(text, update.inline_query.id);
    } else if (update.chosen_inline_result) {
      const message_id: string = update.chosen_inline_result?.inline_message_id || "";

      let new_text = `*${username} said*: ` + text + "\n" + "*Bot says*:";
      await Telegram.editInlineMessage(
        env.TELEGRAM_BOT_KEY,
        `${new_text} ...`,
        message_id,
      );
  
      // const reply = await OpenAI.chatCompletions( env.OPENAI_API_KEY, context);
      const reply = await Claude.chatCompletions( env.ANTHROPIC_API_KEY, context);
      await Utils.saveChatContext(env, contextKey, context, reply);

      await Telegram.editInlineMessage(
        env.TELEGRAM_BOT_KEY,
        `${new_text} ${reply}`,
        message_id,
      );
    }

    return new Response(null);
  },
};
