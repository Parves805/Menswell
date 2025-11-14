'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, User, Phone, MapPin } from 'lucide-react';
import type { Order, ShippingRate, CartItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const checkoutSchema = z.object({
  name: z.string().min(2, { message: 'সম্পূর্ণ নাম আবশ্যক' }),
  phone: z.string().min(10, { message: 'সঠিক ফোন নম্বর দিন' }),
  street: z.string().min(3, { message: 'রাস্তার ঠিকানা আবশ্যক' }),
  shippingZone: z.string().min(1, { message: 'ডেলিভারি এলাকা বেছে নিন।' }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface QuickCheckoutDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: CartItem;
}

export function QuickCheckoutDialog({ isOpen, onOpenChange, item }: QuickCheckoutDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '', phone: '', street: '', shippingZone: '',
    },
  });

  const selectedShippingZoneId = form.watch('shippingZone');
  
  const subtotal = item.price * item.quantity;
  const shippingCost = shippingRates.find(rate => rate.id === selectedShippingZoneId)?.cost ?? 0;
  const total = subtotal + shippingCost;

  useEffect(() => {
    const fetchUserData = async () => {
        if (isFirebaseConfigured && auth.currentUser) {
            const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                form.reset({
                    ...form.getValues(),
                    name: userData.name || '',
                    phone: userData.phone || '',
                    street: userData.address?.street || '',
                });
            }
        }
    };
    fetchUserData();

    const settingsRef = doc(firestore, 'settings', 'store');
    const unsub = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const rates = data.shippingRates || [];
            setShippingRates(rates);
            if (rates.length > 0 && !form.getValues('shippingZone')) {
                form.setValue('shippingZone', rates[0].id);
            }
        }
    });

    return () => unsub();
  }, [form]);

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsProcessing(true);

    const orderId = new Date().getTime().toString();
    const shippingLocation = shippingRates.find(r => r.id === data.shippingZone)?.location || 'N/A';
    const order: Order = {
      id: orderId, date: new Date().toISOString(), items: [item], total: total,
      shippingInfo: {
        name: data.name, email: 'user@example.com', phone: data.phone,
        street: data.street, city: 'N/A', state: shippingLocation, zip: 'N/A',
      },
      paymentDetails: { method: 'cash' },
      status: 'Processing' as const,
    };

    try {
        await setDoc(doc(firestore, 'orders', orderId), order);
        onOpenChange(false);
        router.push(`/thank-you?orderId=${orderId}`);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Order Failed', description: error.message || 'There was a problem with your order.' });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-[95vw] p-0">
            <DialogHeader className="p-4 border-b text-center relative">
                <DialogTitle className="text-xl font-semibold">ক্যাশ অন ডেলিভারিতে অর্ডার করতে আপনার তথ্য দিন</DialogTitle>
                <DialogClose className="absolute right-4 top-4">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </DialogClose>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
                <div className="p-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} id="quick-checkout-form" className="space-y-4">
                            
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">আপনার নাম*</FormLabel>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl><Input {...field} placeholder="আপনার নাম" className="pl-10" /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">ফোন নাম্বার*</FormLabel>
                                     <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl><Input type="tel" {...field} placeholder="ফোন নাম্বার" className="pl-10" /></FormControl>
                                     </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="street" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">এড্রেস*</FormLabel>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl><Input {...field} placeholder="এড্রেস" className="pl-10" /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <div className="space-y-2 pt-2">
                                <h3 className="font-semibold">শিপিং মেথড</h3>
                                <FormField control={form.control} name="shippingZone" render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-1">
                                                {shippingRates.map(rate => (
                                                    <FormItem key={rate.id}>
                                                        <FormLabel className="flex items-center justify-between rounded-lg border p-3 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                                            <div className="flex items-center gap-3">
                                                                <FormControl><RadioGroupItem value={rate.id} /></FormControl>
                                                                <span>{rate.location}</span>
                                                            </div>
                                                            <span className="font-bold">Tk {rate.cost.toFixed(2)}</span>
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                             <div className="flex gap-2 items-end pt-2">
                                <FormItem className="flex-grow">
                                    <FormLabel className="font-semibold">কুপন কোড</FormLabel>
                                    <FormControl><Input placeholder="কুপন কোড" /></FormControl>
                                </FormItem>
                                <Button type="button" variant="default" className="bg-primary hover:bg-primary/90 h-10">এপ্লাই</Button>
                            </div>

                        </form>
                    </Form>

                    <Separator className="my-4"/>

                    <div className="space-y-4">
                         <div className="flex items-center gap-4 p-2 border rounded-lg bg-background">
                            <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border">
                                <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                                 <Badge className="absolute top-0 left-0 rounded-full h-5 w-5 p-0 flex items-center justify-center bg-primary/80">{item.quantity}</Badge>
                            </div>
                            <div className="flex-grow overflow-hidden">
                                <p className="font-medium truncate">{item.name}</p>
                            </div>
                            <p className="font-semibold text-right pl-2">
                                Tk {(item.price * item.quantity).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">সাব টোটাল</span><span>Tk {subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ</span><span>Tk {shippingCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg"><span>সর্বমোট</span><span>Tk {total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
                        </div>
                    </div>
                     <div className="mt-4">
                        <FormField
                            control={form.control}
                            name="street" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">Order note</FormLabel>
                                    <div className="relative">
                                        <FormControl><Input {...field} placeholder="Order note" /></FormControl>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </ScrollArea>
            <div className="p-4 border-t sticky bottom-0 bg-background">
                 <Button type="submit" form="quick-checkout-form" size="lg" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> প্রসেসিং...</>
                    ) : (
                        <>অর্ডার করুন</>
                    )}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
  );
}
