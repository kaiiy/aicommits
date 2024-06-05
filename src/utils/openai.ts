import { openai, tiktoken } from "../deps.ts";
import { generatePrompt } from "./prompt.ts";

const createChatCompletion = async (
  apiKey: string,
  json: {
    prompt: string;
    diff: string;
    model: tiktoken.TiktokenModel;
  },
) => {
  const client = new openai.OpenAI({ apiKey });
  const enc = tiktoken.get_encoding("cl100k_base");
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
    temperature: 0,
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
  model: tiktoken.TiktokenModel,
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
