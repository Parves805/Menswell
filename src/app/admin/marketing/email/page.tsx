
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Order } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';


const emailSchema = z.object({
  recipients: z.string().min(1, { message: 'Please select recipients.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  body: z.string().min(20, { message: 'Email body must be at least 20 characters.' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function EmailMarketingPage() {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [customerCount, setCustomerCount] = useState(0);

    const form = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            recipients: 'all',
            subject: '',
            body: '',
        },
    });
    
    useEffect(() => {
        const unsub = onSnapshot(collection(firestore, 'orders'), (snapshot) => {
            const customerEmails = new Set(snapshot.docs.map(doc => (doc.data() as Order).shippingInfo.email));
            setCustomerCount(customerEmails.size);
        }, (error) => {
            console.error("Failed to load customer data", error);
        });
        return () => unsub();
    }, []);

    const onSubmit = async (data: EmailFormValues) => {
        setIsSending(true);

        try {
            // This is a placeholder for a real email sending service.
            // In a real app, you would integrate with a service like SendGrid, Mailgun, etc.
            console.log("Sending email:", data);
            await new Promise(resolve => setTimeout(resolve, 1500));

            const orderDocs = await getDocs(collection(firestore, 'orders'));
            const customerEmails = new Set(orderDocs.docs.map(doc => (doc.data() as Order).shippingInfo.email));

            toast({
                title: 'Email Sent!',
                description: `The promotional email has been sent to ${customerEmails.size} customer(s).`,
            });
            form.reset();

        } catch (error) {
            console.error("Failed to send marketing emails", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to send emails. Check console for details.',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2"><Mail /> Email Marketing</h1>
            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle>Compose Promotional Email</CardTitle>
                    <CardDescription>Send an email to your customers to promote new products or sales.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="recipients"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recipients</FormLabel>
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select recipients" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    All Customers ({customerCount})
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g., Huge Weekend Sale! 50% Off Everything!" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="body"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Body (supports HTML)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="<h1>Big Sale!</h1><p>Get your favorite products now.</p>" {...field} rows={10}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSending}>
                                    {isSending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Send Email
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
