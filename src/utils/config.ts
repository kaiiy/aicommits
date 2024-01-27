import { tiktoken } from "../deps.ts";

export type ValidConfig = {
  OPENAI_KEY: string;
  locale: string;
  model: tiktoken.TiktokenModel;
  timeout: number;
  "max-length": number;
};
