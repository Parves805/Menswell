'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { Order } from '@/lib/types';
import { format, subMonths, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const key = payload[0].dataKey;
    
    let displayValue = value.toLocaleString('en-IN');
    if (key === 'sales') {
        displayValue = `৳${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    return (
      <div className="bg-background border rounded-lg p-2 shadow-sm text-sm">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-primary">{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${displayValue}`}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
    const [salesData, setSalesData] = useState<any[]>([]);
    const [dailyOrdersData, setDailyOrdersData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(firestore, 'orders'), (snapshot) => {
            const orders = snapshot.docs.map(doc => doc.data() as Order);
            
            const now = new Date();
            
            // --- Process Sales Data for Chart (last 6 months) ---
            const monthlySalesArray = Array.from({ length: 6 }, (_, i) => {
                const d = subMonths(now, 5 - i);
                return { name: format(d, 'MMM'), sales: 0 };
            });

            orders.forEach(order => {
                 if (order.status !== 'Cancelled') {
                    const orderDate = new Date(order.date);
                    if (orderDate >= subMonths(now, 6)) {
                        const monthName = format(orderDate, 'MMM');
                        const monthData = monthlySalesArray.find(m => m.name === monthName);
                        if (monthData) {
                            monthData.sales += order.total;
                        }
                    }
                }
            });
            setSalesData(monthlySalesArray);
            
             // --- Process Daily Orders for Chart (last 7 days) ---
            const dailyOrdersArray = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(now, 6 - i);
                return { name: format(d, 'EEE'), orders: 0 };
            });

            orders.forEach(order => {
                const orderDate = new Date(order.date);
                if (orderDate >= subDays(now, 7)) {
                    const dayName = format(orderDate, 'EEE');
                    const dayData = dailyOrdersArray.find(d => d.name === dayName);
                    if (dayData) {
                        dayData.orders++;
                    }
                }
            });
            setDailyOrdersData(dailyOrdersArray);
            setIsLoading(false);

        }, (error) => {
            console.error("Failed to load analytics data from Firestore", error);
            setIsLoading(false);
        });

        return () => unsub();
    }, []);

    return (
        <div className="space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Analytics</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>Monthly sales performance for the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${Number(value) / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Orders</CardTitle>
                        <CardDescription>Order volume for the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyOrdersData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
                                <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                            </LineChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    
