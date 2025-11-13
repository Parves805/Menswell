
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, PlusCircle, Truck } from 'lucide-react';
import type { ShippingRate } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const rateSchema = z.object({
  id: z.string(),
  location: z.string().min(3, { message: "Location name must be at least 3 characters." }),
  cost: z.coerce.number().min(0, { message: "Cost must be a positive number." }),
});

const formSchema = z.object({
  shippingRates: z.array(rateSchema),
});

type FormValues = z.infer<typeof formSchema>;

const defaultRates: ShippingRate[] = [
    { id: 'inside-dhaka', location: 'Inside Dhaka', cost: 60 },
    { id: 'outside-dhaka', location: 'Outside Dhaka', cost: 120 },
];

export default function ShippingRatesPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { shippingRates: [] },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'shippingRates',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const settingsRef = doc(firestore, 'settings', 'store');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists() && docSnap.data().shippingRates) {
                form.reset({ shippingRates: docSnap.data().shippingRates });
            } else {
                form.reset({ shippingRates: defaultRates });
            }
            setIsMounted(true);
        };
        fetchSettings();
    }, [form]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            const settingsRef = doc(firestore, 'settings', 'store');
            await setDoc(settingsRef, { shippingRates: data.shippingRates }, { merge: true });
            toast({
                title: "Shipping Rates Saved",
                description: "Your shipping rates have been updated successfully.",
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Save Failed",
                description: "Could not save shipping rates.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addNewRate = () => {
        append({
            id: `rate_${Date.now()}`,
            location: 'New Location',
            cost: 0,
        });
    };
    
    if (!isMounted) {
        return <p>Loading shipping settings...</p>;
    }

    return (
        <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2"><Truck /> Shipping Rates</h1>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Manage Shipping Zones</CardTitle>
                            <CardDescription>Set flat shipping rates for different delivery locations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md flex flex-col md:flex-row items-start md:items-end gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`shippingRates.${index}.location`}
                                        render={({ field }) => (
                                            <FormItem className="flex-grow w-full">
                                                <FormLabel>Location Name</FormLabel>
                                                <FormControl><Input {...field} placeholder="e.g., Inside Dhaka" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`shippingRates.${index}.cost`}
                                        render={({ field }) => (
                                            <FormItem className="w-full md:w-auto">
                                                <FormLabel>Cost (৳)</FormLabel>
                                                <FormControl><Input type="number" {...field} className="md:w-32" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="flex-shrink-0">
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove Rate</span>
                                    </Button>
                                </div>
                            ))}
                             <Button type="button" variant="outline" onClick={addNewRate}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New Zone
                            </Button>
                        </CardContent>
                     </Card>
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading} size="lg">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Shipping Rates
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
