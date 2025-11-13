'use server';

import { Resend } from 'resend';
import { generateOrderConfirmationEmail } from '@/ai/flows/generate-order-email';
import type { Order } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(order: Order) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key is not configured. Email not sent.');
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
