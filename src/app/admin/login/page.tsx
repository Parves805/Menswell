
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AdminUser, WebsiteSettings } from '@/lib/types';
import Image from 'next/image';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

const adminLoginSchema = z.object({
  email: z.string().email({ message: 'আপনার ইমেল ঠিকানাটি সঠিক নয়। অনুগ্রহ করে একটি সঠিক ইমেল ব্যবহার করুন।' }),
  password: z.string().min(1, { message: 'পাসওয়ার্ড প্রয়োজন।' }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const defaultAdmin: AdminUser = {
    id: 'default-admin',
    name: 'Mafuz',
    email: 'mafuz@gmail.com',
    password: 'Mafuz@123',
    role: 'Admin',
};


export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    // This effect fetches the logo URL from Firestore.
    const unsub = onSnapshot(doc(firestore, "settings", "store"), (doc) => {
        if (doc.exists()) {
            const settings = doc.data().websiteSettings as WebsiteSettings;
            if (settings && settings.logoUrl) {
                setLogoUrl(settings.logoUrl);
            }
        }
    });
    return () => unsub();
  }, []);


  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);

    const checkDefaultAdmin = () => {
        if (data.email === defaultAdmin.email && data.password === defaultAdmin.password) {
            localStorage.setItem('isAdminAuthenticated', 'true');
            localStorage.setItem('adminUserDetails', JSON.stringify({ name: defaultAdmin.name, email: defaultAdmin.email, role: defaultAdmin.role }));
            toast({
              title: 'Login Successful',
              description: 'Welcome to the Admin Panel.',
            });
            router.push('/admin');
            return true;
        }
        return false;
    }

    if (checkDefaultAdmin()) {
        setIsLoading(false);
        return;
    }

    try {
        const q = query(
            collection(firestore, 'adminUsers'), 
            where('email', '==', data.email), 
            where('password', '==', data.password)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const adminData = querySnapshot.docs[0].data() as Omit<AdminUser, 'id'>;
            localStorage.setItem('isAdminAuthenticated', 'true');
            localStorage.setItem('adminUserDetails', JSON.stringify({ name: adminData.name, email: adminData.email, role: adminData.role }));
            toast({
                title: 'Login Successful',
                description: 'Welcome to the Admin Panel.',
            });
            router.push('/admin');
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Invalid email or password.',
            });
            form.setError("root", { type: "manual", message: "Invalid email or password." });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        toast({
            variant: 'destructive',
            title: 'Login Error',
            description: 'An error occurred while trying to log in.',
        });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-10 w-24 relative">
             {logoUrl && <Image src={logoUrl} alt="Logo" layout="fill" objectFit="contain" />}
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="mafuz@gmail.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Log In'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    