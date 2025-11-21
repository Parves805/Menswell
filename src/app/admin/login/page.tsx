
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
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

const ADMIN_USERS_KEY = 'menswellAdminUsers';

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
};


export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([defaultAdmin]);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    // This effect fetches the admin users from localStorage when the component mounts.
    const loadUsers = () => {
        try {
            const storedUsers = localStorage.getItem(ADMIN_USERS_KEY);
            if (storedUsers) {
                setAdminUsers([defaultAdmin, ...JSON.parse(storedUsers)]);
            } else {
                setAdminUsers([defaultAdmin]);
            }
        } catch (e) {
            console.error("Failed to parse admin users from localStorage", e);
            setAdminUsers([defaultAdmin]);
        }
    };
    loadUsers();
  }, []);

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

  const onSubmit = (data: AdminLoginFormValues) => {
    setIsLoading(true);

    setTimeout(() => {
      const user = adminUsers.find(
        (u) => u.email === data.email && u.password === data.password
      );

      if (user) {
        localStorage.setItem('isAdminAuthenticated', 'true');
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
      setIsLoading(false);
    }, 1000);
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
