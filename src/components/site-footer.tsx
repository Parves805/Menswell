
'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Category, WebsiteSettings } from '@/lib/types';
import Image from 'next/image';
import { firestore } from '@/lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';


export function SiteFooter() {
  const [settings, setSettings] = useState<Partial<WebsiteSettings>>({ storeName: 'BazaarGo' });
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(firestore, "settings", "store"), (doc) => {
        if (doc.exists()) {
            setSettings(s => ({ ...s, ...doc.data().websiteSettings }));
        }
    });

    const unsubCategories = onSnapshot(collection(firestore, 'categories'), (snapshot) => {
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);
    });

    return () => {
        unsubSettings();
        unsubCategories();
    };
  }, []);

  return (
    <footer className="mt-auto border-t bg-secondary/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
             <Link href="/" className="mb-4 flex items-center space-x-2">
                {settings.logoUrl ? (
                    <div className="relative" style={{width: '100px', height: '24px'}}>
                       <Image src={settings.logoUrl} alt={settings.storeName || 'BazaarGo'} fill style={{objectFit: 'contain'}} />
                    </div>
                ) : (
                    <>
                        <ShoppingBag className="h-6 w-6 text-primary" />
                        <span className="font-bold font-headline">{settings.storeName}</span>
                    </>
                )}
            </Link>
            <p className="text-muted-foreground text-sm">Your one-stop online marketplace.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-headline">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-primary">Home</Link></li>
                <li><Link href="/shop" className="hover:text-primary">Shop</Link></li>
                {categories.slice(0, 4).map((category) => (
                    <li key={category.id}><Link href={`/category/${category.id}`} className="hover:text-primary">{category.name}</Link></li>
                ))}
            </ul>
          </div>
          <div>
             <h4 className="font-semibold mb-3 font-headline">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="/returns" className="hover:text-primary">Returns</Link></li>
              <li><Link href="/track-order" className="hover:text-primary">Track Order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-headline">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-headline">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary">Terms and Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
