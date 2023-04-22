export namespace Telegram {
  export interface Update {
    message?: Message;
    inline_query?: InlineQuery;
    chosen_inline_result?: ChosenInlineResult;
    callback_query?: CallbackQuery;
  }

  export interface Message {
    message_id: string;
    from: User;
    chat: Chat;
    text: string;
    via_bot: User;
    reply_to_message?: Message;
  }

  export interface InlineQuery {
    id: string;
    from: User;
    query: string;
  }

  export interface ChosenInlineResult {
    from: User;
    query: string;
    inline_message_id: string;
  }

  export interface CallbackQuery {
    from: User;
    data: string;
    inline_message_id: string;
  }

  export interface User {
    username: string;
    is_bot: boolean;
  }

  export interface Chat {
    id: string;
  }

  export function respondMessage(reply: string, chatId: string) {
    return new Response(
      JSON.stringify({
        method: "sendMessage",
        chat_id: chatId,
        parse_mode: "Markdown",
        text: reply,
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }

  export function respondInlineQuery(reply: string, inlineQueryId: string) {
    return new Response(
      JSON.stringify({
        method: "answerInlineQuery",
        inline_query_id: inlineQueryId,
        results: [
          {
            type: "article",
            id: "1",
            title: "Tap to say",
            input_message_content: {
              message_text: reply,
              parse_mode: "Markdown",
            },
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "OK?",
                    callback_data: reply,
                  },
                ],
              ],
            },
            description: reply,
            thumb_url:
              "https://raw.githubusercontent.com/dmitrime/telegram-chatgpt-bot/main/chik.png",
          },
        ],
        is_personal: true,
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }

  export async function editInlineMessage(
    token: string,
    text: string,
    inlineMessageID: string
  ): Promise<Response> {
    return fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        inline_message_id: inlineMessageID,
        text: text,
        parse_mode: "Markdown",
      }),
    });
  }

  export function sendPhoto(token: string, photo: string, chatId: string) {
    return fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photo,
      }),
    });
  }
}
