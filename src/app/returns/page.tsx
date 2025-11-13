
'use client';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const defaultContent = `We want you to be completely satisfied with your purchase. If you're not happy for any reason, you can return most items for a full refund or exchange within 30 days of the delivery date.

### Conditions for Return:
* Items must be in new, unworn, and unwashed condition.
* Original tags must still be attached.
* Items must be returned in their original packaging.
* Final sale items are not eligible for return or exchange.

### How to Start a Return:
To initiate a return, please visit your "My Orders" page and select the order containing the item you wish to return. If you checked out as a guest, please contact our support team with your order number.

### Refunds:
Once we receive and inspect your return, we will process your refund to the original payment method within 5-7 business days. You will receive an email notification once the refund has been issued.
`;

function markdownToHtml(text: string): string {
    return text
        .replace(/^### (.*$)/gim, '<h3 class="font-semibold text-lg text-foreground mt-4 mb-2">$1</h3>')
        .replace(/\* (.*$)/gim, '<li class="list-disc list-inside">$1</li>')
        .replace(/\n/g, '<br />')
        .replace(/<br \/>(\s*<br \/>)+/g, '<br /><br />'); // handle multiple newlines
}

export default function ReturnsPage() {
  const [content, setContent] = useState(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, "settings", "store"), (docSnap) => {
        if (docSnap.exists() && docSnap.data().legalPagesSettings?.returns) {
            setContent(docSnap.data().legalPagesSettings.returns);
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
            <Card>
                <CardHeader className="text-center">
                    <Undo2 className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-3xl md:text-4xl font-bold font-headline">Return Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
                     {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-8 w-1/3 mt-4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ) : (
                       <div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
                    )}
                    
                    <div className="text-center pt-4">
                        <Link href="/contact">
                            <Button>Contact Support for Help</Button>
                        </Link>
                    </div>

                </CardContent>
            </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
