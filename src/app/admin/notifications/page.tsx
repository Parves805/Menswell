
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


const notificationSchema = z.object({
  message: z.string().min(10, { message: 'Message must be at least 10 characters long.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function AdminNotificationsPage() {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);

    const form = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            message: '',
            imageUrl: '',
        },
    });

    const onSubmit = async (data: NotificationFormValues) => {
        setIsSending(true);

        const newNotification = {
            message: data.message,
            imageUrl: data.imageUrl || null,
            timestamp: serverTimestamp(),
            read: false,
        };

        try {
            await addDoc(collection(firestore, 'notifications'), newNotification);
            
            toast({
                title: 'Notification Sent',
                description: 'The notification has been sent to all users.',
            });
            form.reset();
        } catch (error) {
            console.error('Failed to send notification', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to send notification.',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Send Notification</h1>
            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle>Compose Notification</CardTitle>
                    <CardDescription>Create a message to send to all users. It will appear in their notification dropdown.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="E.g., Big sale this weekend! Get 50% off on all t-shirts." {...field} rows={4}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Optional Image URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/image.png" {...field} />
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
                                    Send Notification
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

    
