
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, 'products'), (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setAllProducts(productsData);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (query && allProducts.length > 0) {
      const lowerCaseQuery = query.toLowerCase();
      const results = allProducts.filter(product => 
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.category.toLowerCase().includes(lowerCaseQuery) ||
        product.brand.toLowerCase().includes(lowerCaseQuery) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
      setFilteredProducts(results);
    } else {
        setFilteredProducts([]);
    }
    setIsLoading(false);
  }, [query, allProducts]);

  return (
     <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <div className="mb-8 text-center">
            {query ? (
                <>
                    <h1 className="text-4xl font-bold font-headline">Search Results for "{query}"</h1>
                    <p className="text-muted-foreground mt-2">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found.</p>
                </>
            ) : (
                <h1 className="text-4xl font-bold font-headline">Search</h1>
            )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                 <Skeleton className="h-[320px] w-full rounded-xl" />
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                 </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <Search className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-2xl font-semibold">No products found for "{query}"</h2>
                <p className="text-muted-foreground mt-2">Try a different search term or browse our categories.</p>
            </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}


export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    )
}
