import { OpenAI } from "https://deno.land/x/openai@v4.24.2/mod.ts";
import { get_encoding, type TiktokenModel } from "npm:@dqbd/tiktoken@1.0.2";
import { generatePrompt } from "./prompt.ts";

const createChatCompletion = async (
  apiKey: string,
  json: {
    prompt: string;
    diff: string;
    model: TiktokenModel;
  },
) => {
  const client = new OpenAI({ apiKey });
  const enc = get_encoding("cl100k_base");
  const tokens = enc.encode(json.diff).length;

  if (tokens > 2048) {
    throw new Error(
      `Your diff is too long (${tokens} tokens). Please try again with a shorter diff.`,
    );
  }

  const chatCompletion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: json.prompt,
      },
      {
        role: "user",
        content: json.diff,
      },
    ],
    model: json.model,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 200,
    stream: false,
  });
  return chatCompletion;
};

const sanitizeMessage = (message: string) =>
  message
    .trim()
    .replace(/[\n\r]/g, "")
    .replace(/(\w)\.$/, "$1");

const deduplicateMessages = (array: string[]) => Array.from(new Set(array));

export const generateCommitMessage = async (
  apiKey: string,
  model: TiktokenModel,
  locale: string,
  diff: string,
  maxLength: number,
) => {
  const prompt = generatePrompt(locale, maxLength);

  const completion = await createChatCompletion(
    apiKey,
    {
      prompt,
      diff,
      model,
    },
  );

  return deduplicateMessages(
    completion.choices
      .filter((choice) => choice.message?.content)
      .map((choice) => sanitizeMessage(choice.message?.content ?? "")),
  );
};
