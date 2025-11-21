
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

let ai;
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

if (apiKey) {
  ai = genkit({
    plugins: [googleAI({ apiKey })],
    model: "googleai/gemini-1.5-flash-latest",
  });
} else {
  console.warn("\n[Menswell] WARNING: GOOGLE_GENAI_API_KEY is not set.");
  console.warn("[Menswell] AI features like product recommendations will be disabled.");
  console.warn("[Menswell] Get a key from https://aistudio.google.com/app/apikey and add it to your .env file.\n");

  ai = genkit({
    plugins: [googleAI({ apiKey: "" })],
    model: "googleai/gemini-1.5-flash-latest",
  });
}

export { ai };
