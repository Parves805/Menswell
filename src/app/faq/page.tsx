import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | Menswell',
};

const faqs = [
    {
        question: "What are your shipping options?",
        answer: "We offer standard, expedited, and overnight shipping. Standard shipping typically takes 5-7 business days, expedited takes 2-3 business days, and overnight shipping arrives the next business day. Shipping costs vary based on the selected option and your location."
    },
    {
        question: "How can I track my order?",
        answer: "Once your order has shipped, you will receive a confirmation email with a tracking number. You can use this number on our 'Track Order' page or directly on the carrier's website to see the status of your delivery."
    },
    {
        question: "What is your return policy?",
        answer: "We accept returns within 30 days of purchase for a full refund. Items must be in their original, unused condition with all tags attached. Please visit our 'Returns' page to initiate a return process."
    },
    {
        question: "How do I make changes to an existing order?",
        answer: "Unfortunately, we are unable to modify orders once they have been placed. If you need to make a change, you will need to cancel your order and place a new one. Please contact our support team for assistance with cancellations."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express), as well as payments through bKash, Nagad, Rocket, and Cash on Delivery."
    }
]

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <div className="text-center mb-12">
            <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-4xl font-bold font-headline">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mt-2">Find answers to common questions about shopping with Menswell.</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-base">
                           {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
