
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ShoppingCart, Users, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Order, Product } from '@/lib/types';
import { format, subMonths, startOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';


const statusColors: { [key: string]: string } = {
  Delivered: 'bg-green-500',
  Processing: 'bg-yellow-500',
  Shipped: 'bg-blue-500',
  Cancelled: 'bg-red-500',
};


export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalCustomers: 0,
        revenueChange: 0,
        salesChange: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const productsQuery = query(collection(firestore, "products"));
        const productsUnsub = onSnapshot(productsQuery, (snapshot) => {
            setTotalProducts(snapshot.size);
        });

        const ordersQuery = query(collection(firestore, "orders"));
        const ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
            const orders: Order[] = snapshot.docs.map(doc => doc.data() as Order);
            
            // --- Calculate Stats ---
            const now = new Date();
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const thisMonthStart = startOfMonth(now);

            let totalRevenue = 0;
            let lastMonthRevenue = 0;
            let thisMonthRevenue = 0;
            let lastMonthSales = 0;
            let thisMonthSales = 0;

            const customerEmails = new Set<string>();

            orders.forEach(order => {
                const orderDate = new Date(order.date);
                if (order.status !== 'Cancelled') {
                    totalRevenue += order.total;
                    if (orderDate >= lastMonthStart && orderDate < thisMonthStart) {
                        lastMonthRevenue += order.total;
                        lastMonthSales++;
                    }
                    if (orderDate >= thisMonthStart) {
                        thisMonthRevenue += order.total;
                        thisMonthSales++;
                    }
                }
                if (order.shippingInfo && order.shippingInfo.email) {
                    customerEmails.add(order.shippingInfo.email);
                }
            });

            const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : thisMonthRevenue > 0 ? 100 : 0;
            const salesChange = lastMonthSales > 0 ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100 : thisMonthSales > 0 ? 100 : 0;

            setStats({
                totalRevenue,
                totalSales: orders.filter(o => o.status !== 'Cancelled').length,
                totalCustomers: customerEmails.size,
                revenueChange,
                salesChange
            });

            // --- Set Recent Orders ---
            const sortedOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentOrders(sortedOrders.slice(0, 5));

            setIsLoading(false);
        });

        return () => {
            productsUnsub();
            ordersUnsub();
        };
    }, []);

    const renderStatCard = (title: string, value: string, change: number, icon: React.ReactNode, changeText: string) => (
        <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-xl md:text-2xl font-bold">{value}</div>}
                {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> : (
                    <p className="text-xs text-muted-foreground flex items-center">
                        {change >= 0 ? 
                            <ArrowUp className="h-3 w-3 mr-1 text-green-500" /> :
                            <ArrowDown className="h-3 w-3 mr-1 text-red-500" /> 
                        }
                        {change.toFixed(1)}% {changeText}
                    </p>
                )}
            </CardContent>
        </Card>
    );

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold font-headline">Dashboard</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {renderStatCard("Total Revenue", `৳${stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, stats.revenueChange, <span className="text-muted-foreground">৳</span>, "from last month")}
        {renderStatCard("Total Sales", `+${stats.totalSales}`, stats.salesChange, <ShoppingCart className="h-4 w-4 text-muted-foreground" />, "from last month")}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-xl md:text-2xl font-bold">{totalProducts}</div>}
            <p className="text-xs text-muted-foreground">in stock</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-xl md:text-2xl font-bold">{stats.totalCustomers}</div>}
            <p className="text-xs text-muted-foreground">unique customers</p>
          </CardContent>
        </Card>
      </div>

       {/* Recent Orders Table */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>A list of the most recent orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[200px] w-full" /> : (
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                    <TableCell>{order.shippingInfo.name}</TableCell>
                    <TableCell>৳{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center gap-2 w-fit">
                            <span className={`h-2 w-2 rounded-full ${statusColors[order.status]}`}></span>
                            {order.status}
                        </Badge>
                    </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">No recent orders.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
