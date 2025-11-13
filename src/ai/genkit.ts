
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let ai;
const apiKey = process.env.GOOGLE_API_KEY;

if (apiKey) {
  ai = genkit({
    plugins: [googleAI({ apiKey, model: 'gemini-1.5-flash-latest' })],
  });
} else {
  // This warning will appear in the server console if the key is missing.
  console.warn("\n[BazaarGo] WARNING: GOOGLE_API_KEY is not set.");
  console.warn("[BazaarGo] AI features like product recommendations will be disabled.");
  console.warn("[BazaarGo] Get a key from https://aistudio.google.com/app/apikey and add it to your .env file.\n");
  
  // Initialize with no plugins if key is not present to avoid crashing the app
  ai = genkit({
    plugins: [],
  });
}

export { ai };
