import { Message } from "./types"

export namespace OpenAI {

  const MODEL: string = "gpt-4o-mini";

  export async function chatCompletions(
    apiKey: string,
    context: Message[]
  ) {
    const initMessage: Message = { role: "system", content: "Short, concise, accurate, sarcastic and funny answers only" };
    context.unshift(initMessage);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: context,
      }),
    });
    const json: OpenAI.Response = await response.json();
    return json.choices[0].message.content.trim();
  }
}
