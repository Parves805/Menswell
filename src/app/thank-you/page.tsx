
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import type { Order } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';

function ThankYouContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            router.replace('/');
            return;
        }

        const fetchOrder = async () => {
            setIsLoading(true);
            try {
                const orderRef = doc(firestore, 'orders', orderId);
                const docSnap = await getDoc(orderRef);

                if (docSnap.exists()) {
                    setOrder(docSnap.data() as Order);
                } else {
                    setError('Order not found. Please check the order ID or contact support.');
                }
            } catch (err) {
                setError('Failed to fetch order details. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, router]);
    
    if (isLoading) {
        return <Skeleton className="h-96 w-full max-w-2xl" />;
    }

    if (error) {
        return (
             <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Button asChild>
                        <Link href="/">Go to Homepage</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (!order) {
        return null;
    }

    return (
        <Card className="w-full max-w-2xl text-center">
            <CardHeader className="items-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <CardTitle className="text-3xl font-bold font-headline">Thank You For Your Order!</CardTitle>
                <CardDescription>আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-left bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono">#{order.id.slice(-8)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Order Date:</span>
                            <span>{format(new Date(order.date), "PPP")}</span>
                        </div>
                         <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span>৳{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">We have sent an order confirmation to your email. You can view your order details and track its status from your account.</p>
            </CardContent>
            <CardFooter className="justify-center gap-4">
                <Button asChild>
                    <Link href="/shop">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Continue Shopping
                    </Link>
                </Button>
                <Button asChild variant="outline">
                     <Link href="/orders">View My Orders</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function ThankYouPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-grow flex items-center justify-center container py-12 px-4 pb-24 md:pb-12">
                <Suspense fallback={<Skeleton className="h-96 w-full max-w-2xl" />}>
                    <ThankYouContent />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    );
}

