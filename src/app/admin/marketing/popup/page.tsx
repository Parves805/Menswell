
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Megaphone } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { PopupCampaign } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


const popupSchema = z.object({
  enabled: z.boolean(),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).or(z.literal('')),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  buttonText: z.string().min(2, { message: "Button text is required." }),
  buttonUrl: z.string().url({ message: "Please enter a valid button link URL." }),
  displayDuration: z.coerce.number().int().min(0, { message: "Duration must be a positive number." }),
});

type PopupFormValues = z.infer<typeof popupSchema>;

const defaultCampaign: PopupCampaign = {
  enabled: false,
  imageUrl: 'https://placehold.co/600x400.png',
  title: 'Special Offer!',
  description: 'Get 20% off on all new arrivals this weekend. Don\'t miss out!',
  buttonText: 'Shop Now',
  buttonUrl: '/shop',
  displayDuration: 10,
};

export default function PopupCampaignPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const form = useForm<PopupFormValues>({
        resolver: zodResolver(popupSchema),
        defaultValues: defaultCampaign,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const settingsRef = doc(firestore, 'settings', 'store');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists() && docSnap.data().popupCampaign) {
                form.reset(docSnap.data().popupCampaign);
            }
            setIsMounted(true);
        };
        fetchSettings();
    }, [form]);


    const onSubmit = async (data: PopupFormValues) => {
        setIsLoading(true);
        try {
            const settingsRef = doc(firestore, 'settings', 'store');
            await setDoc(settingsRef, { popupCampaign: data }, { merge: true });
            toast({
                title: "Popup Campaign Saved",
                description: "Your popup settings have been updated.",
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Save Failed",
                description: "Could not save the popup settings.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isMounted) {
        return <p>Loading campaign settings...</p>;
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2"><Megaphone /> Popup Campaign</h1>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Promotional Popup Settings</CardTitle>
                    <CardDescription>Configure the popup that appears for first-time visitors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="enabled"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Popup</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Turn the popup campaign on or off.
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    
                     <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Image URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/promo.png" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="E.g., Special Offer!" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="E.g., Get 20% off all new arrivals..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="buttonText"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Button Text</FormLabel>
                                <FormControl>
                                    <Input placeholder="E.g., Shop Now" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="buttonUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Button Link URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="/shop" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="displayDuration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Auto-close Duration (seconds)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                 <p className="text-sm text-muted-foreground">
                                    Set to 0 to disable auto-closing.
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading} size="lg">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Campaign
                </Button>
            </div>
            </form>
            </Form>
        </div>
    );
}

    