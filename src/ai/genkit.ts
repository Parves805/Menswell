import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

let ai;
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

if (apiKey) {
  ai = genkit({
    plugins: [googleAI({ apiKey })],
    model: "gemini-1.5-flash",
  });
} else {
  console.warn("\n[Menswell] WARNING: GOOGLE_GENAI_API_KEY is not set.");
  console.warn("[Menswell] AI features like product recommendations will be disabled.");
  console.warn("[Menswell] Get a key from https://aistudio.google.com/app/apikey and add it to your .env file.\n");

  // Even without a key, we configure genkit with a model to prevent crashes.
  // The generate calls will fail gracefully with a proper error.
  ai = genkit({
    plugins: [googleAI({ apiKey: "" })],
    model: "gemini-1.5-flash",
  });
}

export { ai };
