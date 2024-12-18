import Anthropic from "@anthropic-ai/sdk";
import { Message } from "./types"

export namespace Claude {

    const MODEL: string = "claude-3-5-haiku-latest";
      
    function convertToClaudeMessages(messages: Message[]): any[] {
        return messages.map(message => ({
            role: message.role,
            content: [
                {
                    type: "text",
                    text: message.content
                }
            ]
        }));
    }

    export async function chatCompletions(
        apiKey: string,
        context: Message[]
    ) {
        const system: string = "Short, concise, accurate, sarcastic and funny answers only";
        const client = new Anthropic({ apiKey });

        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 1024,
            temperature: 0.7,
            system,
            messages: convertToClaudeMessages(context),
        });

        return msg.content.filter(block => block.type === 'text') .map(block => block.text) .join('\n');
    }
}