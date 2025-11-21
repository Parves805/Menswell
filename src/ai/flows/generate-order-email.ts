
'use server';
/**
 * @fileOverview An AI flow to generate an HTML order confirmation email.
 *
 * - generateOrderConfirmationEmail - A function that generates the email content.
 * - GenerateOrderEmailInput - The input type for the function.
 */

import { ai, defaultModel } from '@/ai/genkit';
import { z } from 'genkit';
import type { Order } from '@/lib/types';

const CartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(z.string()),
  price: z.number(),
  quantity: z.number(),
  selectedSize: z.string().optional(),
  selectedColor: z.object({ name: z.string(), hex: z.string() }).optional(),
});

const ShippingInfoSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

const PaymentDetailsSchema = z.object({
    method: z.string(),
    transactionId: z.string().nullable().optional(),
}).optional();

const OrderSchema = z.object({
  id: z.string(),
  date: z.string(),
  items: z.array(CartItemSchema),
  total: z.number(),
  status: z.string(),
  shippingInfo: ShippingInfoSchema,
  paymentDetails: PaymentDetailsSchema,
});

const GenerateOrderEmailInputSchema = z.object({
  order: OrderSchema,
});
export type GenerateOrderEmailInput = z.infer<typeof GenerateOrderEmailInputSchema>;


export async function generateOrderConfirmationEmail(input: GenerateOrderEmailInput): Promise<string> {
  const result = await generateOrderEmailFlow(input);
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateOrderEmailPrompt',
  input: { schema: z.object({ orderJson: z.string() }) },
  output: { format: 'text' },
  prompt: `
You are an expert email designer for an e-commerce store called "Menswell".
Your task is to generate a professional, modern, and clean HTML order confirmation email based on the provided order details.

**Instructions:**
1.  **Use Inline CSS:** All styles must be inline CSS for maximum compatibility with email clients. Do not use <style> blocks.
2.  **Professional Tone:** The email should be friendly, professional, and reassuring.
3.  **Clear Structure:** The email should have a clear header, order summary, customer details, and footer.
4.  **Order Summary Table:** Create a table for the ordered items with columns for Image, Product, Quantity, and Price.
5.  **Totals Section:** Clearly display the subtotal, shipping cost, and the final total.
6.  **Responsive Design:** Use a single-column layout that works well on both desktop and mobile. Use a container with a max-width of 600px.
7.  **Brand Colors:** Use Menswell's brand colors: Primary: #F26522, Background: #F9EBE1, Text: #333333.
8.  **Do NOT include any placeholders.** Generate the full, complete HTML.
9.  **Date Formatting:** Format the order date nicely (e.g., July 20, 2024).
10. **Currency:** The currency is Bangladeshi Taka (৳). Ensure you use the '৳' symbol before all prices.
11. **Transaction ID:** If a transaction ID is provided with the payment details (e.g., for bKash), display it clearly in the payment information section.

**Order Details (JSON):**
\`\`\`json
{{{orderJson}}}
\`\`\`

Generate ONLY the HTML code for the email. Do not add any extra text or explanations before or after the HTML block.
`,
  model: defaultModel,
});

const generateOrderEmailFlow = ai.defineFlow(
  {
    name: 'generateOrderEmailFlow',
    inputSchema: GenerateOrderEmailInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // We need to pass the order object as a string to the prompt
    // because Handlebars can't handle complex nested objects and arrays directly.
    const subtotal = input.order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const orderWithSubtotal = {
        ...input.order,
        subtotal: subtotal,
        shipping: input.order.total - subtotal
    };
    
    const orderJson = JSON.stringify(orderWithSubtotal, null, 2);

    const { text } = await prompt({
        orderJson,
    });
    return text;
  }
);
