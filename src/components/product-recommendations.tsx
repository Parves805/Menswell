
'use client';

import { useState, useEffect } from 'react';
import { getProductRecommendations, type GetProductRecommendationsResult } from '@/ai/flows/product-recommendations';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { Skeleton } from './ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const RECOMMENDATIONS_CACHE_KEY = 'aiProductRecommendations';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface ProductRecommendationsProps {
  viewingHistory: string[];
}

export function ProductRecommendations({ viewingHistory }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "products"), (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setAllProducts(productsData);
    }, (error) => {
        console.error("Error fetching products for recommendations: ", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (allProducts.length === 0) return;

    async function fetchRecommendations() {
      setLoading(true);
      setError(null);
      
      try {
        const cachedDataJSON = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
        if (cachedDataJSON) {
          const { timestamp, data, history } = JSON.parse(cachedDataJSON);
          if ((Date.now() - timestamp < CACHE_TTL) && JSON.stringify(history) === JSON.stringify(viewingHistory)) {
            setRecommendations(data);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to read recommendations from cache", e);
      }
      
      const viewedProductObjects = viewingHistory
        .map(id => allProducts.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);

      if (viewedProductObjects.length === 0) {
        setLoading(false);
        return;
      }
      
      const simplifiedProducts = allProducts.map(p => ({
          id: p.id,
          name: p.name,
          shortDescription: p.shortDescription,
          category: p.category,
      }));

      const result: GetProductRecommendationsResult = await getProductRecommendations({
        viewedProducts: viewedProductObjects.map(p => ({
            id: p.id,
            name: p.name,
            shortDescription: p.shortDescription,
            category: p.category,
        })),
        allProducts: simplifiedProducts,
        numberOfRecommendations: 6,
      });

      if (result.error) {
        setError(result.error);
        setRecommendations([]); // Clear any old recommendations
      } else if (result.recommendedProducts) {
        const recommendedProds = result.recommendedProducts
          .map(id => allProducts.find(p => p.id === id))
          .filter((p): p is Product => p !== undefined);
        
        setRecommendations(recommendedProds);
        
        try {
          const cacheEntry = {
            timestamp: Date.now(),
            data: recommendedProds,
            history: viewingHistory,
          };
          localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(cacheEntry));
        } catch (e) {
          console.error("Failed to save recommendations to cache", e);
        }
      } else {
         setError('AI failed to generate valid recommendations.');
      }
      
      setLoading(false);
    }

    if (viewingHistory.length > 0) {
      fetchRecommendations();
    } else {
        setLoading(false);
    }
  }, [viewingHistory, allProducts]);

  if (loading) {
     return (
        <Carousel
          opts={{
              align: 'start',
          }}
          className="w-full"
        >
          <CarouselContent>
              {[...Array(6)].map((_, i) => (
                  <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="p-1 h-full space-y-3">
                          <Skeleton className="h-[320px] w-full rounded-xl" />
                          <div className="space-y-2">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[150px]" />
                          </div>
                      </div>
                  </CarouselItem>
              ))}
          </CarouselContent>
        </Carousel>
      );
  }

  // Hide section entirely if there's an error or no recommendations
  if (error || recommendations.length === 0) {
      return null;
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: recommendations.length > 4, // Only loop if there are enough items
      }}
      className="w-full"
    >
      <CarouselContent>
        {recommendations.map((product) => (
          <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
            <div className="p-1 h-full">
                <ProductCard product={product} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="ml-12" />
      <CarouselNext className="mr-12" />
    </Carousel>
  );
}
