
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

interface Customer {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  orders: Order[];
}

const statusColors: { [key: string]: string } = {
  Delivered: 'bg-green-500',
  Processing: 'bg-yellow-500',
  Shipped: 'bg-blue-500',
  Cancelled: 'bg-red-500',
};

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        const q = query(collection(firestore, "orders"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const orders: Order[] = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() } as Order);
            });
            
            const customerMap = new Map<string, Customer>();

            orders.forEach(order => {
                if (!order || !order.shippingInfo || !order.shippingInfo.email) {
                    return;
                }

                const email = order.shippingInfo.email;
                let customer = customerMap.get(email);

                if (customer) {
                    customer.orderCount += 1;
                    customer.totalSpent += order.total;
                    customer.orders.push(order);
                    customer.name = order.shippingInfo.name || customer.name;
                    customer.phone = order.shippingInfo.phone || customer.phone;
                } else {
                    customerMap.set(email, {
                        email: email,
                        name: order.shippingInfo.name || 'N/A',
                        phone: order.shippingInfo.phone || 'N/A',
                        orderCount: 1,
                        totalSpent: order.total,
                        orders: [order],
                    });
                }
            });
            
            const sortedCustomers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
            setCustomers(sortedCustomers);
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to process customer data from Firestore", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const CustomerRowSkeleton = () => (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
    );

    return (
        <div className="space-y-4 md:space-y-6">
            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl">Customers</CardTitle>
                    <CardDescription>A list of your customers and their purchase history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="text-center">Orders</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <>
                                        <CustomerRowSkeleton />
                                        <CustomerRowSkeleton />
                                        <CustomerRowSkeleton />
                                        <CustomerRowSkeleton />
                                        <CustomerRowSkeleton />
                                    </>
                                ) : customers.length > 0 ? (
                                    customers.map((customer) => (
                                        <TableRow key={customer.email}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback>{customer.name ? customer.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{customer.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{customer.email}</TableCell>
                                            <TableCell>{customer.phone}</TableCell>
                                            <TableCell className="text-center">{customer.orderCount}</TableCell>
                                            <TableCell className="text-right">৳{customer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => setSelectedCustomer(customer)}>View Details</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">No customers found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {selectedCustomer && (
                        <Dialog open={!!selectedCustomer} onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}>
                            <DialogContent className="sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>{selectedCustomer.name}</DialogTitle>
                                    <DialogDescription>
                                        {selectedCustomer.email} &bull; {selectedCustomer.phone}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 pt-4 max-h-[70vh] pr-2">
                                     <div className="grid grid-cols-2 gap-4">
                                        <Card className="border-primary/20">
                                            <CardHeader className="pb-2">
                                                <CardDescription>TOTAL ORDERS</CardDescription>
                                                <CardTitle className="text-3xl">{selectedCustomer.orderCount}</CardTitle>
                                            </CardHeader>
                                        </Card>
                                        <Card className="border-primary/20">
                                            <CardHeader className="pb-2">
                                                <CardDescription>TOTAL SPENT</CardDescription>
                                                <CardTitle className="text-3xl">৳{selectedCustomer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</CardTitle>
                                            </CardHeader>
                                        </Card>
                                    </div>
                                    
                                    <Card className="border-primary/20">
                                        <CardHeader>
                                            <CardTitle>Order History</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-72">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Order ID</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead className="text-right">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedCustomer.orders.length > 0 ? selectedCustomer.orders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => (
                                                            <TableRow key={order.id}>
                                                                <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                                                                <TableCell>{format(new Date(order.date), "PPP")}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="flex items-center gap-2 w-fit">
                                                                        <span className={`h-2 w-2 rounded-full ${statusColors[order.status]}`}></span>
                                                                        {order.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">৳{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                            </TableRow>
                                                        )) : (
                                                            <TableRow>
                                                                <TableCell colSpan={4} className="text-center h-24">No orders found for this customer.</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setSelectedCustomer(null)}>Close</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
