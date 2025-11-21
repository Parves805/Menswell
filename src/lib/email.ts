
'use server';

import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
        console.warn('SMTP configuration is missing. Email will be logged to console instead of sent.');
        console.log('--- EMAIL TO: ' + to + ' ---');
        console.log('--- SUBJECT: ' + subject + ' ---');
        console.log(html);
        console.log('-------------------------');
        // In a real app, you might want to throw an error or handle this differently
        // For this demo, we'll return a success-like object to avoid breaking UI flows
        return { success: true, message: 'Email logged to console due to missing SMTP config.' };
    }
    
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.NEXT_PUBLIC_STORE_NAME || 'Menswell'}" <${SMTP_FROM}>`,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send the email.');
    }
}
