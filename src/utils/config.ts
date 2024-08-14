import { openai } from "../deps.ts";

export type ValidConfig = {
  OPENAI_KEY: string;
  locale: string;
  model: openai.OpenAI.ChatModel;
  timeout: number;
  "max-length": number;
};
