'use client';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, Target } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { WebsiteSettings } from '@/lib/types';


export default function AboutPage() {
  const [storeName, setStoreName] = useState('BazaarGo');

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, "settings", "store"), (doc) => {
        if (doc.exists()) {
            const settings = doc.data().websiteSettings as WebsiteSettings;
            if (settings && settings.storeName) {
                setStoreName(currentName => {
                    if (currentName !== settings.storeName) {
                        document.title = `About Us | ${settings.storeName}`;
                        return settings.storeName;
                    }
                    return currentName;
                });
            }
        }
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline">About {storeName}</h1>
            <p className="text-muted-foreground mt-2">Your favorite online shopping destination.</p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-12">
            <Card>
                <div className="grid md:grid-cols-2">
                    <div className="p-8 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold font-headline mb-4">Our Story</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {storeName} started with a simple idea: to make quality products accessible to everyone. We are a passionate team dedicated to curating the best items and providing an exceptional shopping experience. From trendy fashion to everyday essentials, we bring the bazaar to your fingertips.
                        </p>
                    </div>
                     <div className="relative h-64 md:h-auto rounded-b-lg md:rounded-r-lg md:rounded-bl-none overflow-hidden">
                        <Image
                            src="https://placehold.co/600x400.png"
                            alt="Our Team"
                            fill
                            className="object-cover"
                            data-ai-hint="team working"
                        />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                <Card className="p-6">
                    <Target className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-2xl font-headline">Our Mission</CardTitle>
                    <CardContent className="pt-4">
                        <p className="text-muted-foreground">To provide a seamless and enjoyable online shopping experience with a wide range of high-quality products at competitive prices.</p>
                    </CardContent>
                </Card>
                <Card className="p-6">
                    <Building2 className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-2xl font-headline">Our Vision</CardTitle>
                    <CardContent className="pt-4">
                        <p className="text-muted-foreground">To become the most trusted and beloved online marketplace, known for our commitment to quality, customer satisfaction, and innovation.</p>
                    </CardContent>
                </Card>
            </div>
            
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
