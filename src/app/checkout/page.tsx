
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CreditCard, Truck, Loader2 } from 'lucide-react';
import type { Order, PaymentGatewaySettings } from '@/lib/types';
import { generateOrderConfirmationEmail } from '@/ai/flows/generate-order-email';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { sendOrderConfirmationEmail } from '@/lib/email';


const PAYMENT_SETTINGS_KEY = 'paymentGatewaySettings';

const checkoutSchema = z.object({
  name: z.string().min(2, { message: 'সম্পূর্ণ নাম আবশ্যক' }),
  email: z.string().email({ message: 'সঠিক ইমেল ঠিকানা দিন' }),
  phone: z.string().min(10, { message: 'সঠিক ফোন নম্বর দিন' }),
  street: z.string().min(3, { message: 'রাস্তার ঠিকানা আবশ্যক' }),
  city: z.string().min(2, { message: 'শহরের নাম আবশ্যক' }),
  zip: z.string().min(4, { message: 'পোস্ট কোড আবশ্যক' }),
  paymentMethod: z.enum(['cash', 'bkash', 'nagad', 'rocket'], {
    required_error: "আপনাকে একটি পেমেন্ট পদ্ধতি বেছে নিতে হবে।",
  }),
  transactionId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'bkash' && (!data.transactionId || data.transactionId.trim().length < 5)) {
        return false;
    }
    return true;
}, {
    message: "একটি সঠিক বিকাশ লেনদেন আইডি প্রয়োজন।",
    path: ["transactionId"],
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const shippingCost = 5.00;

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart, totalItems } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentGatewaySettings>({
    cashOnDelivery: true,
    bkash: true,
    bkashNumber: '',
    nagad: true,
    rocket: true,
  });

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      zip: '',
      paymentMethod: 'cash',
      transactionId: '',
    },
  });

  const selectedPaymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    // Redirect to home if cart is empty
    if (totalItems === 0 && !isProcessing) {
      router.replace('/');
    }

    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const { savedUser } = JSON.parse(savedProfile);
        if (savedUser) {
           form.reset({
            name: savedUser.name || '',
            email: savedUser.email || '',
            phone: savedUser.phone || '',
            street: savedUser.address?.street || '',
            city: savedUser.address?.city || '',
            zip: savedUser.address?.zip || '',
            paymentMethod: form.getValues('paymentMethod'),
            transactionId: '',
          });
        }
      }
    } catch (error) {
      console.error("Failed to load user profile from localStorage", error);
    }
    
    try {
        const savedPaymentSettings = localStorage.getItem(PAYMENT_SETTINGS_KEY);
        if (savedPaymentSettings) {
            const settings = JSON.parse(savedPaymentSettings);
            setPaymentSettings({
              cashOnDelivery: settings.cashOnDelivery,
              bkash: settings.bkash,
              bkashNumber: settings.bkashNumber || '',
              nagad: settings.nagad,
              rocket: settings.rocket,
            });
        }
    } catch (error) {
        console.error("Failed to load payment settings from localStorage", error);
    }

  }, [totalItems, router, isProcessing, form]);


  const onSubmit = async (data: CheckoutFormValues) => {
    setIsProcessing(true);

    const orderId = new Date().getTime().toString();
    const order: Order = {
      id: orderId,
      date: new Date().toISOString(),
      items: cartItems,
      total: subtotal + shippingCost,
      shippingInfo: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: '', // Kept for type consistency, but empty
        zip: data.zip,
      },
      paymentDetails: {
          method: data.paymentMethod,
          transactionId: data.transactionId,
      },
      status: 'Processing' as const,
    };

    try {
        // 1. Save to Firestore
        const orderRef = doc(firestore, 'orders', orderId);
        await setDoc(orderRef, order);
        
        // 2. Save to localStorage (for "My Orders" page)
        const existingOrdersJson = localStorage.getItem('bazaargoUserOrders');
        const existingOrders = existingOrdersJson ? JSON.parse(existingOrdersJson) : [];
        const updatedOrders = [...existingOrders, order];
        localStorage.setItem('bazaargoUserOrders', JSON.stringify(updatedOrders));

        // 3. Send confirmation email
        await sendOrderConfirmationEmail(order);

        toast({
            title: "Email Sent",
            description: "An order confirmation email has been sent to you.",
        });

    } catch (error: any) {
        console.error("Failed to save order or send email", error);
         toast({
            variant: 'destructive',
            title: 'Order Failed',
            description: error.message || 'There was a problem processing your order.',
        });
        setIsProcessing(false); // Stop processing on failure
        return;
    }

    clearCart();
    toast({
      title: 'অর্ডার সফল হয়েছে!',
      description: 'আপনার কেনাকাটার জন্য ধন্যবাদ। আপনার অর্ডারটি পাঠানো হলে আপনাকে জানানো হবে।',
    });

    router.push('/orders');
  };
  
  if (totalItems === 0 && !isProcessing) {
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-grow flex items-center justify-center pb-16 md:pb-0">
                <p>আপনার কার্ট খালি। আপনাকে হোমপেজে পাঠানো হচ্ছে...</p>
            </main>
            <SiteFooter />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8 text-center">Checkout</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Shipping & Payment */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>ডেলিভারির তথ্য</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>পুরো নাম</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                  <div>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>ইমেল</FormLabel>
                            <FormControl>
                                <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                  <div>
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>ফোন</FormLabel>
                            <FormControl>
                                <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                  <div className="sm:col-span-2">
                     <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>রাস্তার ঠিকানা</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>শহর</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>পোস্ট কোড</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>পেমেন্ট পদ্ধতি</CardTitle>
                </CardHeader>
                <CardContent>
                   <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-4"
                            >
                                {paymentSettings.cashOnDelivery && (
                                <FormItem>
                                    <Label className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                        <FormControl>
                                            <RadioGroupItem value="cash" />
                                        </FormControl>
                                        <Truck className="h-6 w-6" />
                                        <div>
                                            <span className="font-semibold">ক্যাশ অন ডেলিভারি</span>
                                            <p className="text-sm text-muted-foreground">আপনার অর্ডার হাতে পেয়ে নগদ অর্থে পরিশোধ করুন।</p>
                                        </div>
                                    </Label>
                                </FormItem>
                                )}
                                {paymentSettings.bkash && (
                                <FormItem>
                                    <Label className="flex flex-col items-start gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                        <div className="flex items-start gap-4 w-full">
                                            <FormControl>
                                                <RadioGroupItem value="bkash" className="mt-1" />
                                            </FormControl>
                                            <CreditCard className="h-6 w-6" />
                                            <div className="flex-grow">
                                                <span className="font-semibold">বিকাশ</span>
                                                <p className="text-sm text-muted-foreground">বিকাশ মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p>
                                            </div>
                                        </div>
                                        {selectedPaymentMethod === 'bkash' && (
                                            <div className="w-full pl-10 space-y-3">
                                                {paymentSettings.bkashNumber && (
                                                    <Alert>
                                                        <AlertDescription>
                                                            অনুগ্রহ করে এই বিকাশ পার্সোনাল নাম্বারে টাকা পাঠান: <strong className="text-primary">{paymentSettings.bkashNumber}</strong>.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                                <FormField
                                                    control={form.control}
                                                    name="transactionId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>বিকাশ লেনদেন আইডি</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="যেমন, 9X7Y6Z5A4B" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </Label>
                                </FormItem>
                                )}
                                {paymentSettings.nagad && (
                                <FormItem>
                                    <Label className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                        <FormControl>
                                            <RadioGroupItem value="nagad" />
                                        </FormControl>
                                        <CreditCard className="h-6 w-6" />
                                        <div>
                                            <span className="font-semibold">নগদ</span>
                                            <p className="text-sm text-muted-foreground">নগদ মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p>
                                        </div>
                                    </Label>
                                </FormItem>
                                )}
                                {paymentSettings.rocket && (
                                <FormItem>
                                    <Label className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                        <FormControl>
                                            <RadioGroupItem value="rocket" />
                                        </FormControl>
                                        <CreditCard className="h-6 w-6" />
                                        <div>
                                            <span className="font-semibold">রকেট</span>
                                            <p className="text-sm text-muted-foreground">রকেট মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p>
                                        </div>
                                    </Label>
                                </FormItem>
                                )}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>অর্ডারের সারাংশ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-4">
                    {cartItems.map(item => (
                      <div key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor?.name || ''}`} className="flex items-start gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border">
                          <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <p className="font-medium truncate">{item.name}</p>
                          <div className="text-sm text-muted-foreground">
                            {[item.selectedSize, item.selectedColor?.name].filter(Boolean).join(' / ')}
                          </div>
                          <div className="text-sm text-muted-foreground">পরিমাণ: {item.quantity}</div>
                        </div>
                        <p className="font-medium text-right pl-2">
                          ৳{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">মোট মূল্য</span>
                          <span>৳{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                          <span>৳{shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>সর্বমোট</span>
                          <span>৳{(subtotal + shippingCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
                      {isProcessing ? (
                          <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              প্রসেসিং...
                          </>
                      ) : (
                          <>
                              অর্ডার করুন (৳{(subtotal + shippingCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </>
                      )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </Form>
      </main>
      <SiteFooter />
    </div>
  );
}
