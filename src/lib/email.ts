
'use server';

import { Resend } from 'resend';
import { generateOrderConfirmationEmail } from '@/ai/flows/generate-order-email';
import type { Order } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(order: Order) {
  // Do not attempt to generate email if AI key is missing
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('[BazaarGo] GOOGLE_API_KEY not set. Skipping AI email generation.');
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[BazaarGo] RESEND_API_KEY not set. Skipping sending email.');
    // Log the generated HTML to the console for manual use if AI key is present
    try {
        const emailHtml = await generateOrderConfirmationEmail({ order });
        console.log("---- ORDER CONFIRMATION EMAIL (HTML) ----");
        console.log(emailHtml);
        console.log("-----------------------------------------");
    } catch(e) {
        console.error("Failed to generate email HTML for logging.", e);
    }
    return;
  }

  try {
    const emailHtml = await generateOrderConfirmationEmail({ order });
    
    const { data, error } = await resend.emails.send({
      from: 'BazaarGo <onboarding@resend.dev>', // You must verify your domain on Resend to use a custom 'from' address
      to: [order.shippingInfo.email],
      subject: `Your BazaarGo Order Confirmation #${order.id.slice(-6)}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error in sendOrderConfirmationEmail:', error);
    // Re-throw the error to be caught by the calling function
    throw error;
  }
}
