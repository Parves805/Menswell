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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Truck, Loader2, X } from 'lucide-react';
import type { Order, PaymentGatewaySettings, ShippingRate, CartItem } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from './ui/card';

const checkoutSchema = z.object({
  name: z.string().min(2, { message: 'সম্পূর্ণ নাম আবশ্যক' }),
  email: z.string().email({ message: 'সঠিক ইমেল ঠিকানা দিন' }),
  phone: z.string().min(10, { message: 'সঠিক ফোন নম্বর দিন' }),
  street: z.string().min(3, { message: 'রাস্তার ঠিকানা আবশ্যক' }),
  city: z.string().min(2, { message: 'শহরের নাম আবশ্যক' }),
  zip: z.string().min(4, { message: 'পোস্ট কোড আবশ্যক' }),
  shippingZone: z.string().min(1, { message: 'ডেলিভারি এলাকা বেছে নিন।' }),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket'], {
    required_error: "আপনাকে একটি পেমেন্ট পদ্ধতি বেছে নিতে হবে।",
  }),
  transactionId: z.string().optional(),
}).refine(data => {
    if ((data.paymentMethod === 'bkash' || data.paymentMethod === 'nagad' || data.paymentMethod === 'rocket') && (!data.transactionId || data.transactionId.trim().length < 5)) {
        return false;
    }
    return true;
}, {
    message: "একটি সঠিক লেনদেন আইডি প্রয়োজন।",
    path: ["transactionId"],
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
  const [paymentSettings, setPaymentSettings] = useState<PaymentGatewaySettings>({
    cashOnDelivery: true,
    bkash: true,
    bkashNumber: '',
    nagad: true,
    nagadNumber: '',
    rocket: true,
    rocketNumber: '',
  });

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '', email: '', phone: '', street: '', city: '', zip: '',
      shippingZone: '', paymentMethod: 'cash', transactionId: '',
    },
  });

  const selectedPaymentMethod = form.watch('paymentMethod');
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
                    name: userData.name || '', email: userData.email || '', phone: userData.phone || '',
                    street: userData.address?.street || '', city: userData.address?.city || '', zip: userData.address?.zip || '',
                });
            }
        }
    };
    fetchUserData();

    const settingsRef = doc(firestore, 'settings', 'store');
    const unsub = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setPaymentSettings(data.paymentGatewaySettings || {});
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
        name: data.name, email: data.email, phone: data.phone,
        street: data.street, city: data.city, state: shippingLocation, zip: data.zip,
      },
      paymentDetails: { method: data.paymentMethod, transactionId: data.transactionId },
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
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl p-0 grid grid-cols-1 md:grid-cols-2">
            
            {/* Form Section */}
            <div className="md:col-span-1 flex flex-col">
                 <ScrollArea className="flex-grow">
                    <Card className="border-0 shadow-none">
                        <CardHeader>
                            <DialogTitle className="text-2xl">ডেলিভারির তথ্য</DialogTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                           <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} id="quick-checkout-form" className="space-y-4">
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>পুরো নাম</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>ইমেল</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>ফোন</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="street" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>রাস্তার ঠিকানা</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>শহর</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="zip" render={({ field }) => (<FormItem><FormLabel>পোস্ট কোড</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={form.control} name="shippingZone" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>ডেলিভারি এলাকা</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="আপনার ডেলিভারি এলাকা বেছে নিন" /></SelectTrigger></FormControl><SelectContent>{shippingRates.map(rate => (<SelectItem key={rate.id} value={rate.id}>{rate.location}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    </div>
                                    
                                    <div className="space-y-4 pt-4">
                                        <h3 className="font-semibold text-lg">পেমেন্ট পদ্ধতি</h3>
                                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                            <FormItem className="space-y-3"><FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-4">
                                                {paymentSettings.cashOnDelivery && (<FormItem><FormLabel className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary"><FormControl><RadioGroupItem value="cash" /></FormControl><Truck className="h-6 w-6" /><div><span className="font-semibold">ক্যাশ অন ডেলিভারি</span><p className="text-sm text-muted-foreground">আপনার অর্ডার হাতে পেয়ে নগদ অর্থে পরিশোধ করুন।</p></div></FormLabel></FormItem>)}
                                                {paymentSettings.bkash && (<FormItem><FormLabel className="flex flex-col items-start gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary"><div className="flex items-start gap-4 w-full"><FormControl><RadioGroupItem value="bkash" className="mt-1" /></FormControl><CreditCard className="h-6 w-6" /><div className="flex-grow"><span className="font-semibold">বিকাশ</span><p className="text-sm text-muted-foreground">বিকাশ মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p></div></div>{selectedPaymentMethod === 'bkash' && (<div className="w-full pl-10 space-y-3">{paymentSettings.bkashNumber && (<Alert><AlertDescription>অনুগ্রহ করে এই বিকাশ পার্সোনাল নাম্বারে টাকা পাঠান: <strong className="text-primary">{paymentSettings.bkashNumber}</strong>. অর্ডার নিশ্চিত করার জন্য বিকাশ সেন্ড মানি করার পর, আপনি যে লেনদেন আইডি (Txn ID) পাবেন, সেটি এখানে লিখুন।</AlertDescription></Alert>)}<FormField control={form.control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>বিকাশ লেনদেন আইডি</FormLabel><FormControl><Input {...field} placeholder="যেমন, 9X7Y6Z5A4B" /></FormControl><FormMessage /></FormItem>)} /></div>)}</FormLabel></FormItem>)}
                                                {paymentSettings.nagad && (<FormItem><FormLabel className="flex flex-col items-start gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary"><div className="flex items-start gap-4 w-full"><FormControl><RadioGroupItem value="nagad" className="mt-1" /></FormControl><CreditCard className="h-6 w-6" /><div className="flex-grow"><span className="font-semibold">নগদ</span><p className="text-sm text-muted-foreground">নগদ মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p></div></div>{selectedPaymentMethod === 'nagad' && (<div className="w-full pl-10 space-y-3">{paymentSettings.nagadNumber && (<Alert><AlertDescription>অনুগ্রহ করে এই নগদ পার্সোনাল নাম্বারে টাকা পাঠান: <strong className="text-primary">{paymentSettings.nagadNumber}</strong>.</AlertDescription></Alert>)}<FormField control={form.control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>নগদ লেনদেন আইডি</FormLabel><FormControl><Input {...field} placeholder="যেমন, 9X7Y6Z5A4B" /></FormControl><FormMessage /></FormItem>)} /></div>)}</FormLabel></FormItem>)}
                                                {paymentSettings.rocket && (<FormItem><FormLabel className="flex flex-col items-start gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary"><div className="flex items-start gap-4 w-full"><FormControl><RadioGroupItem value="rocket" className="mt-1" /></FormControl><CreditCard className="h-6 w-6" /><div className="flex-grow"><span className="font-semibold">রকেট</span><p className="text-sm text-muted-foreground">রকেট মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p></div></div>{selectedPaymentMethod === 'rocket' && (<div className="w-full pl-10 space-y-3">{paymentSettings.rocketNumber && (<Alert><AlertDescription>অনুগ্রহ করে এই রকেট পার্সোনাল নাম্বারে টাকা পাঠান: <strong className="text-primary">{paymentSettings.rocketNumber}</strong>.</AlertDescription></Alert>)}<FormField control={form.control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>রকেট লেনদেন আইডি</FormLabel><FormControl><Input {...field} placeholder="যেমন, 9X7Y6Z5A4B" /></FormControl><FormMessage /></FormItem>)} /></div>)}</FormLabel></FormItem>)}
                                            </RadioGroup></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </ScrollArea>
                <DialogFooter className="p-6 pt-0">
                    <Button type="submit" form="quick-checkout-form" size="lg" className="w-full" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `অর্ডার করুন (৳${total.toLocaleString('en-IN')})`}
                    </Button>
                </DialogFooter>
            </div>

            {/* Order Summary Section */}
            <div className="hidden md:flex flex-col md:col-span-1 p-6 bg-muted/50">
                <div className="flex-grow space-y-6">
                    <h3 className="font-semibold text-2xl">অর্ডারের সারাংশ</h3>
                    <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                        <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border">
                            <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {[item.selectedSize, item.selectedColor?.name].filter(Boolean).join(' / ')}
                            </p>
                            <p className="text-sm text-muted-foreground">পরিমাণ: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-right pl-2">
                            ৳{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">মোট মূল্য</span><span>৳{subtotal.toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ</span><span>৳{shippingCost.toLocaleString('en-IN')}</span></div>
                        <Separator />
                        <div className="flex justify-between font-bold text-xl"><span>সর্বমোট</span><span>৳{total.toLocaleString('en-IN')}</span></div>
                    </div>
                </div>
                <div className="mt-6">
                     <Button type="submit" form="quick-checkout-form" size="lg" className="w-full" disabled={isProcessing}>
                        {isProcessing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> প্রসেসিং...</>
                        ) : (
                            <>অর্ডার করুন (৳{total.toLocaleString('en-IN')})</>
                        )}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
