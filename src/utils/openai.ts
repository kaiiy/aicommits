import { OpenAI } from "openai";
import { TiktokenModel } from "tiktoken";
import { KnownError } from "./error.ts";
import { generatePrompt } from "./prompt.ts";

const createChatCompletion = async (
  apiKey: string,
  json: {
    content: string;
    diff: string;
    model: TiktokenModel;
  },
) => {
  const client = new OpenAI({ apiKey });
  const chatCompletion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: json.content,
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
  try {
    const completion = await createChatCompletion(
      apiKey,
      {
        content: generatePrompt(locale, maxLength),
        diff,
        model,
      },
    );

    return deduplicateMessages(
      completion.choices
        .filter((choice) => choice.message?.content)
        .map((choice) => sanitizeMessage(choice.message?.content ?? "")),
    );
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      throw new KnownError(
        `Error connecting to ${error.hostname} (${error.syscall}). Are you connected to the internet?`,
      );
    }

    throw error;
  }
};
