'use client';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Target, Rocket } from 'lucide-react';
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
            <h1 className="text-4xl font-bold font-headline">Welcome to {storeName}</h1>
            <p className="text-muted-foreground mt-2">— Where Style Meets Confidence —</p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-12">
            <Card>
                <div className="grid md:grid-cols-2">
                    <div className="p-8 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold font-headline mb-4">Our Story</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {storeName} is a young and vibrant clothing brand built for today’s generation. We design fashion that blends comfort, confidence, and creativity — made especially for students and young adults who want to look sharp without trying too hard.
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
            
            <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-primary mb-4" />
                <h2 className="text-3xl font-bold font-headline mb-4">Our Audience</h2>
                <p className="max-w-2xl mx-auto text-muted-foreground leading-relaxed">
                    Our target customers are 16–28-year-old school, college, and university students who believe that style is more than just what you wear — it’s how you express yourself.
                </p>
            </div>

            <Card className="p-6 text-center">
                <Rocket className="mx-auto h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-2xl font-headline">Our Mission</CardTitle>
                <CardContent className="pt-4 max-w-3xl mx-auto">
                    <p className="text-muted-foreground">To make everyday fashion accessible, stylish, and full of attitude — empowering young people to express who they are through what they wear.</p>
                    <p className="text-muted-foreground mt-4">We aim to deliver premium-quality apparel that reflects the latest trends while staying affordable for students and youth communities.</p>
                </CardContent>
            </Card>
            
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
