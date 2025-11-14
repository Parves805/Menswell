
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Order | BazaarGo',
};

export default function TrackOrderPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <SiteHeader />
      <main className="flex-grow flex items-center justify-center py-12 px-4 pb-24 md:pb-12">
        <Card className="w-full max-w-md border-primary/20">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <Truck className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline">Track Your Order</CardTitle>
                <CardDescription>Enter your order ID to see its status.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="order-id">Order ID</Label>
                        <Input id="order-id" placeholder="Enter your order ID" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Billing Email</Label>
                        <Input id="email" type="email" placeholder="The email you used for the order" />
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full">Track Order</Button>
            </CardFooter>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
