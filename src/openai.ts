export namespace OpenAI {
  export interface Message {
    role: string;
    content: string;
  }

  export async function chatCompletions(
    apiKey: string,
    model: string,
    prompt: string,
    user: string,
    context: Message[]
  ) {
    if (prompt.trim() != "") {
      const initMessage: Message = { role: "system", content: prompt };
      context.unshift(initMessage);
    }
    model = model.trim() ? model : "gpt-3.5-turbo";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: model,
        user: user,
        messages: context,
      }),
    });
    const json: OpenAI.Response = await response.json();
    return json.choices[0].message.content.trim();
  }
}
