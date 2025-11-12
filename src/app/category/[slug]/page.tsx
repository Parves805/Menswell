
'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProductCard } from '@/components/product-card';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';


export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!slug) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);

    const categoryRef = doc(firestore, 'categories', slug);
    const categoryUnsub = onSnapshot(categoryRef, (docSnap) => {
        if (docSnap.exists()) {
            setCategory({ id: docSnap.id, ...docSnap.data() } as Category);
        } else {
            setCategory(null);
        }
    });

    const productsQuery = query(collection(firestore, 'products'), where('category', '==', slug));
    const productsUnsub = onSnapshot(productsQuery, (snapshot) => {
        const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productData);
        setIsLoading(false);
    });

    return () => {
        categoryUnsub();
        productsUnsub();
    }
  }, [slug]);

  useEffect(() => {
    if (!isLoading && !category) {
      notFound();
    }
  }, [isLoading, category]);


  if (isLoading || !category) {
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-grow pb-16 md:pb-0">
                <Skeleton className="h-56 w-full" />
                <div className="container py-8 md:py-12">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-[320px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow pb-16 md:pb-0">
        <section className="relative h-56 w-full">
            <Image
                src={category.bannerImage}
                alt={`${category.name} banner`}
                fill
                className="object-cover"
                data-ai-hint={`mens ${category.id.replace('-', ' ')}`}
                priority
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white p-4">
                    <h1 className="text-3xl md:text-5xl font-bold font-headline">{category.name}</h1>
                    <p className="text-md md:text-lg mt-2">Explore our collection of {category.name.toLowerCase()}.</p>
                </div>
            </div>
        </section>

        <div className="container py-8 md:py-12">
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span>{category.name}</span>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-lg text-muted-foreground">No products found in this category yet.</p>
                </div>
            )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
