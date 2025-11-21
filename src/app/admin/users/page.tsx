
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
import { useToast } from '@/hooks/use-toast';
import type { AdminUser, AdminRole } from '@/lib/types';
import { Loader2, Trash2, PlusCircle, UserCog } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';


const adminUserSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'A valid email is required.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    role: z.enum(['Admin', 'Editor', 'Viewer'], { required_error: 'Role is required.' }),
});

type AdminUserFormValues = z.infer<typeof adminUserSchema>;

const ROLES: AdminRole[] = ['Admin', 'Editor', 'Viewer'];
const MAIN_ADMIN_EMAIL = 'mafuz@gmail.com';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { toast } = useToast();
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    const form = useForm<AdminUserFormValues>({
        resolver: zodResolver(adminUserSchema),
        defaultValues: { name: '', email: '', password: '', role: 'Editor' },
    });
    
    useEffect(() => {
        const adminDetails = localStorage.getItem('adminUserDetails');
        if (adminDetails) {
            setCurrentUserEmail(JSON.parse(adminDetails).email);
        }

        const unsubscribe = onSnapshot(collection(firestore, 'adminUsers'), (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
            setUsers(fetchedUsers);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching admin users: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch admin users.' });
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [toast]);

    if (currentUserEmail && currentUserEmail !== MAIN_ADMIN_EMAIL) {
        return (
             <div className="space-y-4 md:space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You do not have permission to manage admin users.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const handleAddUser = async (data: AdminUserFormValues) => {
        setIsSubmitting(true);
        
        const q = query(collection(firestore, 'adminUsers'), where('email', '==', data.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            toast({ variant: 'destructive', title: 'Error', description: 'An admin with this email already exists.' });
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(firestore, 'adminUsers'), {
                name: data.name,
                email: data.email,
                password: data.password, // Note: In a real app, this should be hashed.
                role: data.role,
            });
            toast({ title: 'Admin Added', description: `Admin user "${data.name}" has been created.` });
        } catch (error) {
            console.error("Error adding admin:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create admin user.' });
        }
        
        setIsSubmitting(false);
        setIsAddDialogOpen(false);
        form.reset();
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteDoc(doc(firestore, "adminUsers", userId));
            toast({ title: 'Admin Deleted', description: 'The admin user has been removed.' });
        } catch (error) {
            console.error("Error deleting admin:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete admin user.' });
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl md:text-3xl flex items-center gap-2"><UserCog /> Admin Users</CardTitle>
                        <CardDescription>Add, remove, and manage admin accounts with different roles.</CardDescription>
                    </div>
                     <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Admin User</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
                                     <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g., jane@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="role" render={({ field }) => (
                                        <FormItem><FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Add Admin
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
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 p-4 rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-grow space-y-2">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                     <TableRow key={user.id}>
                                         <TableCell>
                                             <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.name}</span>
                                             </div>
                                         </TableCell>
                                         <TableCell>{user.email}</TableCell>
                                         <TableCell>{user.role}</TableCell>
                                         <TableCell className="text-right">
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this admin user.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Delete
                                                        </AlertDialogAction>
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
        </div>
    );
}
