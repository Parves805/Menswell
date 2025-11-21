
'use client';

import { AuthForm } from '@/components/auth-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { WebsiteSettings } from '@/lib/types';


export default function SignupPage() {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
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

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow flex items-center justify-center py-12 px-4 pb-24 md:pb-12">
        <Card className="w-full max-w-md">
             <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold font-headline">Create an Account</CardTitle>
                <CardDescription>Create an account to get started with Menswell.</CardDescription>
            </CardHeader>
            <CardContent>
                <AuthForm type="signup" />
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                    Log in
                    </Link>
                </p>
            </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

    