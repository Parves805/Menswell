
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

const defaultContent = `রিটার্ন ও এক্সচেঞ্জ নীতি (Return & Exchange Policy)

সর্বশেষ আপডেট: নভেম্বর ২০২৫

আপনার সন্তুষ্টি আমাদের প্রথম অগ্রাধিকার। যদি কোনো কারণে আপনি আপনার ক্রয় করা পণ্য নিয়ে সম্পূর্ণ সন্তুষ্ট না হন, তাহলে নিচের শর্তাবলীর মাধ্যমে আপনি পণ্যটি রিটার্ন বা এক্সচেঞ্জ করতে পারবেন।

🛍️ ১. রিটার্ন/এক্সচেঞ্জের সময়সীমা
আপনি পণ্যটি পাওয়ার ৭ দিনের মধ্যে রিটার্ন বা এক্সচেঞ্জের অনুরোধ করতে পারবেন।
৭ দিনের পর কোনো রিটার্ন বা এক্সচেঞ্জ গ্রহণ করা হবে না।

👕 ২. রিটার্ন করার যোগ্যতা (Eligibility)
রিটার্ন বা এক্সচেঞ্জের জন্য নিচের শর্তগুলো পূরণ করতে হবে:
* পণ্যটি অব্যবহৃত, অক্ষত ও অপরিষ্কার নয় এমন অবস্থায় থাকতে হবে।
* ট্যাগ, লেবেল, ও প্যাকেজিং সম্পূর্ণ অক্ষত থাকতে হবে।
* সেল/ডিসকাউন্ট পণ্য, গিফট আইটেম বা বিশেষ অফারের পণ্য রিটার্নযোগ্য নয়।

🚚 ৩. রিটার্ন প্রক্রিয়া (Return Process)
১. রিটার্ন করতে চাইলে আমাদের কাস্টমার কেয়ারে যোগাযোগ করুন:
📞 +880 1617574456
📧 hridoygd4456@gmail.com
২. যাচাই শেষে আপনাকে রিটার্ন ঠিকানা জানিয়ে দেওয়া হবে।
৩. কুরিয়ার মারফত পণ্যটি পাঠাতে হবে, এবং রিটার্ন ডেলিভারি চার্জ গ্রাহককে বহন করতে হবে (যদি পণ্য ত্রুটিমুক্ত হয়)।
৪. যদি পণ্যটি ক্ষতিগ্রস্ত বা ভুলভাবে পাঠানো হয়, তাহলে BazaarGo সম্পূর্ণ ডেলিভারি খরচ বহন করবে।

💵 ৪. রিফান্ড নীতি (Refund Policy)
পণ্যটি আমাদের হাতে পৌঁছানোর পর এবং যাচাই শেষে ৫–১০ কর্মদিবসের মধ্যে রিফান্ড প্রক্রিয়া সম্পন্ন হবে।
রিফান্ড আপনার bKash/Nagad/Bank Account-এ প্রদান করা হবে।
যদি ক্রয়কৃত পণ্যটি এক্সচেঞ্জ করা হয়, তবে নতুন পণ্যের ডেলিভারি চার্জ প্রযোজ্য হতে পারে।

🧥 ৫. ক্ষতিগ্রস্ত বা ভুল পণ্য (Damaged / Wrong Item)
যদি আপনি ভুল বা ক্ষতিগ্রস্ত পণ্য পান, তাহলে সাথে সাথে আমাদের সাথে যোগাযোগ করুন (পণ্য পাওয়ার ২৪ ঘণ্টার মধ্যে)।
আমরা যাচাই করে দ্রুত সমাধান প্রদান করব — হয় নতুন পণ্য প্রেরণ অথবা রিফান্ড।

⚠️ ৬. গুরুত্বপূর্ণ নোট (Important Notes)
* রিটার্ন পণ্য আমাদের টিম যাচাইয়ের পরেই অনুমোদিত হবে।
* রিটার্ন করা পণ্য ব্যবহার বা ক্ষতিগ্রস্ত পাওয়া গেলে তা অগ্রহণযোগ্য বলে গণ্য হবে।
* ডেলিভারি চার্জ রিফান্ডযোগ্য নয় যদি না পণ্যটি ভুল বা ত্রুটিপূর্ণ হয়।

💬 যোগাযোগ করুন (Contact Us)
রিটার্ন বা এক্সচেঞ্জ সংক্রান্ত যেকোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন:
📞 +880 1617574456
📧 hridoygd4456@gmail.com
`;

function markdownToHtml(text: string): string {
    return text
        .replace(/^(🛍️|👕|🚚|💵|🧥|⚠️|💬) (.*\S.*)/gim, '<h3 class="font-semibold text-lg text-foreground mt-4 mb-2 flex items-center gap-2">$1 $2</h3>')
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
            <Card className="border-primary/20">
                <CardHeader className="text-center">
                    <Undo2 className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-3xl md:text-4xl font-bold font-headline">রিটার্ন ও এক্সচেঞ্জ নীতি</CardTitle>
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
