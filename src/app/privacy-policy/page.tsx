
'use client';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const defaultContent = `BazaarGo ("us", "we", or "our") operates the BazaarGo website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.

### Information Collection and Use
We collect several different types of information for various purposes to provide and improve our Service to you. This may include, but is not limited to, your name, email address, phone number, and shipping address.

### Log Data
We may also collect information that your browser sends whenever you visit our Service ("Log Data"). This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other statistics.

### Security of Data
The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.

### Changes to This Privacy Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
`;

function markdownToHtml(text: string): string {
    return text
        .replace(/^### (.*$)/gim, '<h3 class="font-semibold text-lg text-foreground mt-4 mb-2">$1</h3>')
        .replace(/\n/g, '<br />');
}

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState<string>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, "settings", "store"), (docSnap) => {
        if (docSnap.exists() && docSnap.data().legalPagesSettings?.privacy) {
            setContent(docSnap.data().legalPagesSettings.privacy);
        } else {
            setContent(defaultContent);
        }
        setIsLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <div className="max-w-3xl mx-auto">
            <Card className="border-primary/20">
                <CardHeader className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-3xl md:text-4xl font-bold font-headline">Privacy Policy</CardTitle>
                    <CardDescription>Our commitment to your privacy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                             <Skeleton className="h-8 w-1/3 mt-4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ) : (
                       <div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
