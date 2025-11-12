
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

const plugins = [];
const apiKey = process.env.GOOGLE_API_KEY;

if (apiKey) {
  plugins.push(googleAI({ apiKey, model: 'gemini-1.5-flash-latest' }));
} else {
  // This warning will appear in the server console if the key is missing.
  console.warn("\n[BazaarGo] WARNING: GOOGLE_API_KEY is not set.");
  console.warn("[BazaarGo] AI features like product recommendations will be disabled.");
  console.warn("[BazaarGo] Get a key from https://aistudio.google.com/app/apikey and add it to your .env file.\n");
}

export const ai = genkit({
  plugins,
});
