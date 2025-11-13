
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | BazaarGo',
};

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-3xl md:text-4xl font-bold font-headline">Terms and Conditions</CardTitle>
                    <CardDescription>Last Updated: November 2025</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
                    <p>Welcome to BazaarGo. By accessing or using our website, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully before using our services.</p>
                    
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-foreground">1. General</h3>
                        <p>By visiting our Site or purchasing something from us, you engage in our “Service” and agree to be bound by these Terms and Conditions, including additional terms and policies referenced herein or available by hyperlink. If you do not agree to all the terms, then you may not access the website or use any services.</p>
                    </div>

                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">2. Eligibility</h3>
                         <p>To use this Site, you must be at least 16 years old. If you are under 18, you must use the Site under the supervision of a parent or guardian.</p>
                    </div>
                    
                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">3. Products and Pricing</h3>
                         <p>We aim to display product colors and details as accurately as possible. However, slight variations may occur due to screen differences.</p>
                         <p>Prices are subject to change without prior notice.</p>
                         <p>All prices are listed in Bangladeshi Taka (BDT) and are inclusive/exclusive of applicable taxes (as specified on the product page).</p>
                    </div>

                     <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">4. Orders and Payment</h3>
                         <p>Once an order is placed, you will receive a confirmation email or SMS.</p>
                         <p>We reserve the right to refuse or cancel any order at our discretion.</p>
                         <p>Accepted payment methods include Cash on Delivery, bKash, Nagad, and Debit/Credit Card.</p>
                         <p>In case of payment failure or unauthorized use, we are not liable for any resulting losses.</p>
                    </div>

                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">5. Shipping and Delivery</h3>
                         <p>We deliver across Bangladesh via trusted courier partners.</p>
                         <p>Delivery times may vary depending on your location, typically within 2–7 business days.</p>
                         <p>Shipping charges (if applicable) will be displayed at checkout.</p>
                    </div>

                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">6. Returns and Exchanges</h3>
                         <p>You may request a return or exchange within 7 days of receiving your order.</p>
                         <p>Items must be unused, unwashed, and in original condition with tags attached.</p>
                         <p>Refunds will be processed after we receive and inspect the returned item.</p>
                         <p>For full details, please visit our Return Policy page.</p>
                    </div>
                    
                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">7. Intellectual Property</h3>
                         <p>All content on this website—including images, designs, logos, and text—is the property of BazaarGo and protected by copyright laws. You may not reproduce, distribute, or use any content without written permission.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-foreground">8. User Conduct</h3>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Use the Site for unlawful or fraudulent purposes.</li>
                            <li>Upload or transmit harmful code or viruses.</li>
                            <li>Attempt to hack, damage, or interfere with the Site’s security.</li>
                        </ul>
                        <p>Violation of these terms may result in immediate termination of your access.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-foreground">9. Privacy</h3>
                        <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal data.</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-foreground">10. Limitation of Liability</h3>
                        <p>BazaarGo is not liable for:</p>
                         <ul className="list-disc pl-6 space-y-1">
                            <li>Any indirect, incidental, or consequential damages resulting from the use or inability to use our Site or products.</li>
                            <li>Any delay or failure beyond our reasonable control (e.g., natural disasters, transport delays, or technical issues).</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">11. Changes to Terms</h3>
                         <p>We may update these Terms and Conditions at any time without prior notice. The latest version will always be available on this page.</p>
                    </div>

                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg text-foreground">12. Governing Law</h3>
                         <p>These Terms are governed by and interpreted in accordance with the laws of Bangladesh. Any disputes will be resolved under the jurisdiction of the courts of Dhaka, Bangladesh.</p>
                    </div>

                </CardContent>
            </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
