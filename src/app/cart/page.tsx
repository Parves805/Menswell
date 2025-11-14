
'use client';

import { useCart } from '@/context/cart-context';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingCart as ShoppingCartIcon, ArrowRight, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const shippingCost = 5.00;

export default function CartPage() {
  const { cartItems, subtotal, totalItems, updateQuantity, removeItem } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8 text-center">Your Shopping Cart</h1>
        {totalItems > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Cart Items ({totalItems})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-primary/20">
                    {cartItems.map(item => (
                      <div key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor?.name || ''}`} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                        <div className="relative h-24 w-24 flex-shrink-0 rounded-md overflow-hidden border-primary/20">
                          <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className="md:col-span-1">
                            <p className="font-semibold">{item.name}</p>
                            {(item.selectedSize || item.selectedColor) && (
                                <p className="text-sm text-muted-foreground">
                                    {[item.selectedSize, item.selectedColor?.name].filter(Boolean).join(' / ')}
                                </p>
                            )}
                            <p className="md:hidden mt-2 font-medium">
                                ৳{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                            </p>
                          </div>
                          <div className="flex items-center border-primary/20 rounded-md w-fit justify-self-start md:justify-self-center">
                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor?.name, item.quantity - 1)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-bold">{item.quantity}</span>
                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor?.name, item.quantity + 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-4 w-full">
                            <p className="font-medium text-lg hidden md:block">
                              ৳{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor?.name)}>
                              <Trash2 className="h-5 w-5" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-primary/20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>৳{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>৳{shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>৳{(subtotal + shippingCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                  </div>
                </CardContent>
                <CardFooter>
                    <Button asChild size="lg" className="w-full">
                        <Link href="/checkout">
                            Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </CardFooter>
              </Card>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-primary/20 rounded-lg">
            <ShoppingCartIcon className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold">Your cart is empty.</h2>
            <p className="text-muted-foreground mt-2">Looks like you haven't added any items to your cart yet.</p>
            <Button asChild className="mt-6">
                <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
