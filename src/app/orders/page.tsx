
'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { ListOrdered, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import type { Order } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const statusColors: { [key: string]: string } = {
  Processing: 'bg-yellow-500',
  Shipped: 'bg-blue-500',
  Delivered: 'bg-green-500',
  Cancelled: 'bg-red-500',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const savedOrders = localStorage.getItem('bazaargoUserOrders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
            setOrders(parsed as Order[]);
        } else {
            setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to load orders from localStorage", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
      return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-grow container py-8 md:py-12 flex items-center justify-center pb-16 md:pb-0">
                <p>Loading orders...</p>
            </main>
            <SiteFooter />
        </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <ListOrdered className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="text-3xl font-bold font-headline">My Orders</CardTitle>
                        <CardDescription>View your order history and status.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {orders.map((order) => (
                            <AccordionItem value={order.id} key={order.id} className="border rounded-lg">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4">
                                        <div className="mb-2 sm:mb-0">
                                            <p className="font-bold">Order #{order.id.slice(-6)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Placed on {format(new Date(order.date), "PPP")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 justify-between">
                                            <p className="font-semibold text-lg">
                                                ৳{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <Badge variant="outline" className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${statusColors[order.status]}`}></span>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border-t">
                                    <h4 className="font-semibold mb-2">Items</h4>
                                    <div className="space-y-4 mb-4">
                                        {order.items.map((item) => (
                                            <div key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor?.name || ''}`} className="flex items-center gap-4">
                                                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                                    <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-medium">{item.name}</p>
                                                    {(item.selectedSize || item.selectedColor) && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {[item.selectedSize, item.selectedColor?.name].filter(Boolean).join(' / ')}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-medium">
                                                    ৳{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator className="my-4" />
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Shipping To</h4>
                                            <div className="text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">{order.shippingInfo.name}</p>
                                                <p>{order.shippingInfo.street}</p>
                                                <p>{order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zip}</p>
                                                <p>{order.shippingInfo.email}</p>
                                                <p>{order.shippingInfo.phone}</p>
                                            </div>
                                        </div>
                                         <div>
                                            <h4 className="font-semibold mb-2">Payment Method</h4>
                                            <p className="text-sm text-muted-foreground capitalize">{order.paymentDetails?.method}</p>
                                            {order.paymentDetails?.method === 'bkash' && order.paymentDetails?.transactionId && (
                                                <>
                                                    <h4 className="font-semibold mt-2 mb-1">Transaction ID</h4>
                                                    <p className="text-sm text-muted-foreground font-mono">{order.paymentDetails.transactionId}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">You have not placed any orders yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
