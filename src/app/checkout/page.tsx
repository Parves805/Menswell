
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CreditCard, Truck, Loader2 } from 'lucide-react';
import type { Order, PaymentGatewaySettings, ShippingRate, Coupon } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';


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
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const USER_PROFILE_KEY = 'userProfile';

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart, totalItems } = useCart();
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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      zip: '',
      shippingZone: '',
      paymentMethod: 'cash',
      transactionId: '',
    },
  });

  const selectedPaymentMethod = form.watch('paymentMethod');
  const selectedShippingZoneId = form.watch('shippingZone');
  
  const shippingCost = shippingRates.find(rate => rate.id === selectedShippingZoneId)?.cost ?? 0;
  const total = subtotal - discount + shippingCost;


  useEffect(() => {
    if (totalItems === 0 && !isProcessing) {
      router.replace('/');
    }

    const fetchUserData = async () => {
        if (isFirebaseConfigured && auth.currentUser) {
            const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                form.reset({
                    ...form.getValues(),
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    street: userData.address?.street || '',
                    city: userData.address?.city || '',
                    zip: userData.address?.zip || '',
                });
            }
        } else {
             // Load from localStorage for guests
            try {
                const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
                if (savedProfile) {
                    const { savedUser } = JSON.parse(savedProfile);
                    form.reset({
                        ...form.getValues(),
                        name: savedUser.name || '',
                        email: savedUser.email || '',
                        phone: savedUser.phone || '',
                        street: savedUser.address?.street || '',
                        city: savedUser.address?.city || '',
                        zip: savedUser.address?.zip || '',
                    });
                }
            } catch (error) {
                console.error("Failed to load user profile from localStorage", error);
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
  }, [totalItems, router, isProcessing, form]);
  
  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        setDiscount((subtotal * appliedCoupon.discountValue) / 100);
      } else {
        setDiscount(appliedCoupon.discountValue);
      }
    } else {
      setDiscount(0);
    }
  }, [appliedCoupon, subtotal]);

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      setIsApplyingCoupon(true);
      setCouponError('');
      setAppliedCoupon(null);
      
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
          setCouponError('Invalid coupon code.');
      } else {
          const couponDoc = querySnapshot.docs[0];
          const couponData = couponDoc.data() as Omit<Coupon, 'id'>;
          
          if (new Date(couponData.expiryDate.toDate()) < new Date()) {
              setCouponError('This coupon has expired.');
          } else {
              setAppliedCoupon({ ...couponData, id: couponDoc.id });
              toast({ title: 'Coupon Applied!', description: `You received a discount.` });
          }
      }
      setIsApplyingCoupon(false);
  }


  const onSubmit = async (data: CheckoutFormValues) => {
    setIsProcessing(true);

    const orderId = new Date().getTime().toString();
    const shippingLocation = shippingRates.find(r => r.id === data.shippingZone)?.location || 'N/A';
    const order: Order = {
      id: orderId,
      date: new Date().toISOString(),
      items: cartItems,
      subtotal: subtotal,
      discount: discount,
      shippingCost: shippingCost,
      total: total,
      shippingInfo: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: shippingLocation,
        zip: data.zip,
      },
      paymentDetails: {
          method: data.paymentMethod,
          transactionId: data.transactionId || null,
      },
      status: 'Processing' as const,
      coupon: appliedCoupon ? { code: appliedCoupon.code, discount: discount } : null,
    };
    
     // Also save profile data to local storage for guests/persistence
    const profileToSave = {
        savedUser: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: {
                street: data.street,
                city: data.city,
                state: shippingLocation,
                zip: data.zip,
            },
        },
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileToSave));

    try {
        const orderRef = doc(firestore, 'orders', orderId);
        await setDoc(orderRef, order);
        
        toast({
            title: 'Order Placed!',
            description: 'Your order has been successfully placed.',
        });

    } catch (error: any) {
        console.error("Failed to save order", error);
         toast({
            variant: 'destructive',
            title: 'Order Failed',
            description: error.message || 'There was a problem processing your order.',
        });
        setIsProcessing(false);
        return;
    }

    clearCart();

    router.push(`/thank-you?orderId=${orderId}`);
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
            
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>ডেলিভারির তথ্য</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                     <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>পুরো নাম</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div>
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>ইমেল</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div>
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>ফোন</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="sm:col-span-2">
                     <FormField control={form.control} name="street" render={({ field }) => (<FormItem><FormLabel>রাস্তার ঠিকানা</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>শহর</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="zip" render={({ field }) => (<FormItem><FormLabel>পোস্ট কোড</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="shippingZone"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>ডেলিভারি এলাকা</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="আপনার ডেলিভারি এলাকা বেছে নিন" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {shippingRates.map(rate => (
                                          <SelectItem key={rate.id} value={rate.id}>{rate.location}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
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
                                    <Label className="flex items-center gap-4 rounded-lg border-primary/20 p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary/20-primary">
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
                                    <Label className="flex flex-col items-start gap-4 rounded-lg border-primary/20 p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary/20-primary">
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
                                                            অনুগ্রহ করে এই বিকাশ পার্সোনাল নাম্বারে টাকা পাঠান: <strong className="text-primary">{paymentSettings.bkashNumber}</strong>. অর্ডার নিশ্চিত করার জন্য বিকাশ সেন্ড মানি করার পর, আপনি যে লেনদেন আইডি (Txn ID) পাবেন, সেটি এখানে লিখুন।
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
                                    <Label className="flex flex-col items-start gap-4 rounded-lg border-primary/20 p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary/20-primary">
                                        <div className="flex items-start gap-4 w-full">
                                            <FormControl>
                                                <RadioGroupItem value="nagad" className="mt-1" />
                                            </FormControl>
                                            <CreditCard className="h-6 w-6" />
                                            <div className="flex-grow">
                                                <span className="font-semibold">নগদ</span>
                                                <p className="text-sm text-muted-foreground">নগদ মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p>
                                            </div>
                                        </div>
                                         {selectedPaymentMethod === 'nagad' && (
                                            <div className="w-full pl-10 space-y-3">
                                                {paymentSettings.nagadNumber && (
                                                    <Alert>
                                                        <AlertDescription>
                                                            অনুগ্রহ করে এই নগদ পার্সোনাল নাম্বারে টাকা পাঠান: <strong className="text-primary">{paymentSettings.nagadNumber}</strong>.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                                <FormField
                                                    control={form.control}
                                                    name="transactionId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>নগদ লেনদেন আইডি</FormLabel>
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
                                {paymentSettings.rocket && (
                                 <FormItem>
                                    <Label className="flex flex-col items-start gap-4 rounded-lg border-primary/20 p-4 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary/20-primary">
                                        <div className="flex items-start gap-4 w-full">
                                            <FormControl>
                                                <RadioGroupItem value="rocket" className="mt-1" />
                                            </FormControl>
                                            <CreditCard className="h-6 w-6" />
                                            <div className="flex-grow">
                                                <span className="font-semibold">রকেট</span>
                                                <p className="text-sm text-muted-foreground">রকেট মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করুন।</p>
                                            </div>
                                        </div>
                                         {selectedPaymentMethod === 'rocket' && (
                                            <div className="w-full pl-10 space-y-3">
                                                {paymentSettings.rocketNumber && (
                                                    <Alert>
                                                        <AlertDescription>
                                                            অনুগ্রহ করে এই রকেট পার্সোনাল নাম্বারে টাকা পাঠান: <strong className="text-primary">{paymentSettings.rocketNumber}</strong>.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                                <FormField
                                                    control={form.control}
                                                    name="transactionId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>রকেট লেনদেন আইডি</FormLabel>
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
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-primary/20">
                <CardHeader>
                  <CardTitle>অর্ডারের সারাংশ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-4">
                    {cartItems.map(item => (
                      <div key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor?.name || ''}`} className="flex items-start gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-primary/20">
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
                        <div className="flex gap-2">
                            <Input placeholder="Coupon Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={!!appliedCoupon} />
                            <Button type="button" onClick={handleApplyCoupon} disabled={isApplyingCoupon || !!appliedCoupon}>
                                {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </Button>
                        </div>
                        {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                    </div>
                  <div className="space-y-2">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">মোট মূল্য</span>
                          <span>৳{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {appliedCoupon && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-muted-foreground">Discount ({appliedCoupon.code})</span>
                            <span>- ৳{discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                      )}
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                          <span>৳{shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>সর্বমোট</span>
                          <span>৳{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                              অর্ডার করুন (৳{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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
