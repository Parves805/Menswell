
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Coupon, Order, WebsiteSettings, ThemeSettings } from '@/lib/types';
import { Loader2, Trash2, PlusCircle, CalendarIcon, Ticket, Eye, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const couponSchema = z.object({
    code: z.string().min(4, { message: 'Code must be at least 4 characters.' }).regex(/^[a-zA-Z0-9]+$/, { message: 'Code can only contain letters and numbers.' }),
    discountType: z.enum(['fixed', 'percentage'], { required_error: 'Discount type is required.' }),
    discountValue: z.coerce.number().min(0, { message: 'Discount value must be positive.' }),
    expiryDate: z.date({ required_error: 'Expiry date is required.' }),
});
type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponWithUsage extends Coupon {
    usageCount: number;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<CouponWithUsage[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [viewingOrdersFor, setViewingOrdersFor] = useState<string | null>(null);
    const { toast } = useToast();
    const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema),
        defaultValues: { code: '', discountType: 'fixed', discountValue: 0 },
    });
    
    const ordersForCoupon = viewingOrdersFor ? orders.filter(o => o.coupon?.code === viewingOrdersFor) : [];

    useEffect(() => {
        const settingsUnsub = onSnapshot(doc(firestore, "settings", "store"), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setWebsiteSettings(data.websiteSettings);
                setThemeSettings(data.themeSettings);
            }
        });
        
        const couponUnsub = onSnapshot(collection(firestore, "coupons"), (couponSnapshot) => {
            const fetchedCoupons = couponSnapshot.docs.map(doc => {
                const data = doc.data();
                // Firestore timestamps need to be converted to JS Date objects
                const expiryDate = data.expiryDate?.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate);
                return {
                    id: doc.id,
                    ...data,
                    expiryDate,
                } as Coupon;
            });

            const orderUnsub = onSnapshot(collection(firestore, "orders"), (orderSnapshot) => {
                const fetchedOrders: Order[] = orderSnapshot.docs.map(doc => doc.data() as Order);
                setOrders(fetchedOrders);

                const couponUsageMap = new Map<string, number>();
                fetchedOrders.forEach(order => {
                    if (order.coupon?.code) {
                        couponUsageMap.set(order.coupon.code, (couponUsageMap.get(order.coupon.code) || 0) + 1);
                    }
                });

                const couponsWithUsage: CouponWithUsage[] = fetchedCoupons.map(coupon => ({
                    ...coupon,
                    usageCount: couponUsageMap.get(coupon.code) || 0,
                }));
                
                setCoupons(couponsWithUsage);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching orders:", error);
                setIsLoading(false);
            });

            return () => orderUnsub();
        }, (error) => {
            console.error("Error fetching coupons: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch coupons.' });
            setIsLoading(false);
        });

        return () => {
            settingsUnsub();
            couponUnsub();
        }
    }, [toast]);
    
    const generateRandomCode = () => {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        form.setValue('code', `SALE${randomPart}`);
    };

    const handleDownloadPdf = async () => {
        if (!viewingOrdersFor || ordersForCoupon.length === 0) return;

        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        
        const doc = new jsPDF();
        
        const addHeader = async () => {
             // Main Title
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Orders Using Coupon: ${viewingOrdersFor}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

            if (websiteSettings?.logoUrl) {
                try {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                    img.src = proxyUrl + websiteSettings.logoUrl;

                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0);
                            const dataUrl = canvas.toDataURL('image/png');
                            doc.addImage(dataUrl, 'PNG', 14, 15, 40, 12);
                            resolve();
                        };
                        img.onerror = (err) => reject(err);
                    });
                } catch (e) {
                     // Fallback to text if image fails
                    if(websiteSettings.storeName){
                        doc.setFontSize(22);
                        doc.setTextColor(themeSettings?.primary || '#000000');
                        doc.text(websiteSettings.storeName, 14, 20);
                    }
                }
            } else if (websiteSettings?.storeName) {
                doc.setFontSize(22);
                doc.setTextColor(themeSettings?.primary || '#000000');
                doc.text(websiteSettings.storeName, 14, 20);
            }
            
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text('01617574456', 14, 26);
            doc.text('hridoygd4456@gmail.com', 14, 30);
            doc.text('Road-21, Sector-11, Uttara, Dhaka, Bangladesh', 14, 34);
        };

        await addHeader();
        
        autoTable(doc, {
            startY: 45,
            head: [['Order ID', 'Customer', 'Date', 'Subtotal']],
            body: ordersForCoupon.map(order => [
                `#${order.id.slice(-6)}`,
                order.shippingInfo.name,
                format(new Date(order.date), "PPP"),
                `BDT ${order.subtotal?.toFixed(2) || '0.00'}`
            ]),
            footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
            foot: [
                ['Total Orders', ordersForCoupon.length.toString(), 'Total Subtotal', `BDT ${ordersForCoupon.reduce((sum, order) => sum + (order.subtotal || 0), 0).toFixed(2)}`]
            ],
            didDrawPage: async function (data) {
                if (data.pageNumber > 1) {
                    await addHeader();
                }
            }
        });
        
        doc.save(`coupon_${viewingOrdersFor}_usage_report.pdf`);
    };

    const handleAddCoupon = async (data: CouponFormValues) => {
        setIsSubmitting(true);
        const codeUpper = data.code.toUpperCase();
        
        const q = query(collection(firestore, 'coupons'), where('code', '==', codeUpper));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            toast({
                variant: 'destructive',
                title: "Coupon Exists",
                description: `A coupon with the code "${codeUpper}" already exists.`,
            });
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(firestore, 'coupons'), {
                ...data,
                code: codeUpper,
                createdAt: serverTimestamp(),
            });
            toast({
                title: "Coupon Added",
                description: `The coupon "${codeUpper}" has been created.`,
            });
            setIsSubmitting(false);
            setIsAddDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error adding coupon: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add the coupon.' });
            setIsSubmitting(false);
        }
    };

    const handleDeleteCoupon = async (couponId: string) => {
        try {
            await deleteDoc(doc(firestore, "coupons", couponId));
            toast({
                title: "Coupon Deleted",
                description: "The coupon has been successfully deleted.",
            });
        } catch (error) {
            console.error("Error deleting coupon: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the coupon.' });
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl md:text-3xl flex items-center gap-2"><Ticket /> Coupon Codes</CardTitle>
                        <CardDescription>Create and manage discount coupons for your store.</CardDescription>
                    </div>
                     <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Coupon
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Coupon</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleAddCoupon)} className="space-y-4">
                                    <div className="flex items-end gap-2">
                                        <FormField control={form.control} name="code" render={({ field }) => (
                                            <FormItem className="flex-grow"><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="e.g., SUMMER25" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <Button type="button" variant="outline" onClick={generateRandomCode}>Generate</Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="discountType" render={({ field }) => (
                                            <FormItem><FormLabel>Discount Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Fixed Amount (BDT)</SelectItem>
                                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            <FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="discountValue" render={({ field }) => (
                                            <FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>Expiry Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        <FormMessage /></FormItem>
                                    )} />
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Add Coupon
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                     <TableRow key={coupon.id}>
                                         <TableCell className="font-medium">{coupon.code}</TableCell>
                                         <TableCell>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `BDT ${coupon.discountValue}`}</TableCell>
                                         <TableCell>{format(coupon.expiryDate, 'PPP')}</TableCell>
                                         <TableCell>{coupon.usageCount}</TableCell>
                                         <TableCell className="text-right space-x-2">
                                              <Button variant="outline" size="icon" onClick={() => setViewingOrdersFor(coupon.code)} disabled={coupon.usageCount === 0}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View Orders</span>
                                              </Button>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the coupon.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCoupon(coupon.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                         </TableCell>
                                     </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
            </Card>

             {/* View Orders Dialog */}
            <Dialog open={!!viewingOrdersFor} onOpenChange={(isOpen) => !isOpen && setViewingOrdersFor(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Orders using coupon: {viewingOrdersFor}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ordersForCoupon.length > 0 ? (
                                    ordersForCoupon.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <Link href="/admin/orders" className="font-medium text-primary hover:underline">
                                                    #{order.id.slice(-6)}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{order.shippingInfo.name}</TableCell>
                                            <TableCell>{format(new Date(order.date), "PPP")}</TableCell>
                                            <TableCell className="text-right">BDT {(order.subtotal || order.total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No orders found for this coupon.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <DialogFooter className="sm:justify-between">
                         <Button variant="outline" onClick={handleDownloadPdf} disabled={ordersForCoupon.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                        <Button variant="outline" onClick={() => setViewingOrdersFor(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
