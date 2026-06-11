import OpenAI from "openai";

export const MODEL = process.env.OPENAI_MODEL || "gpt-5.1";

let client: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("缺少 OPENAI_API_KEY，请在 .env 里配置后重启");
  }
  return (client ??= new OpenAI());
}
