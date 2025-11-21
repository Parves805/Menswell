
'use client';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const defaultContent = `Last Updated: November 2025
Welcome to Menswell. By accessing or using our website, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully before using our services.

### 1. General
By visiting our Site or purchasing something from us, you engage in our “Service” and agree to be bound by these Terms and Conditions...

(Default content continues)
`;

function markdownToHtml(text: string): string {
    return text
        .replace(/^### (.*$)/gim, '<h3 class="font-semibold text-lg text-foreground mt-4 mb-2">$1</h3>')
        .replace(/\n/g, '<br />');
}

export default function TermsOfServicePage() {
  const [content, setContent] = useState<string>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, "settings", "store"), (docSnap) => {
        if (docSnap.exists() && docSnap.data().legalPagesSettings?.terms) {
            setContent(docSnap.data().legalPagesSettings.terms);
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
                    <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-3xl md:text-4xl font-bold font-headline">Terms and Conditions</CardTitle>
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
