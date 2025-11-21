
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let ai;
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

if (apiKey) {
  ai = genkit({
    plugins: [googleAI({ apiKey, apiVersion: "v1beta" })],
  });
} else {
  // This warning will appear in the server console if the key is missing.
  console.warn("\n[Menswell] WARNING: GOOGLE_GENAI_API_KEY is not set.");
  console.warn("[Menswell] AI features like product recommendations will be disabled.");
  console.warn("[Menswell] Get a key from https://aistudio.google.com/app/apikey and add it to your .env file.\n");
  
  // Initialize with a model but no key to prevent crashing, but AI calls will fail with a clear error.
  ai = genkit({
    plugins: [googleAI({ apiKey: '' })],
  });
}

export { ai };
