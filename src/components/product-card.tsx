
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, StarHalf, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Product } from '@/lib/types';
import { Badge } from './ui/badge';
import { useWishlist } from '@/context/wishlist-context';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

function Rating({ rating, reviewCount }: { rating: number, reviewCount: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`full_${i}`} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
        {halfStar && <StarHalf className="w-4 h-4 fill-yellow-500 text-yellow-500" />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty_${i}`} className="w-4 h-4 text-muted-foreground/50" />)}
      </div>
      <span>({reviewCount})</span>
    </div>
  );
}


export function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product);
  }

  return (
    <Card className="w-full h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col bg-card">
      <CardHeader className="p-0">
        <div className="relative aspect-square w-full">
          <Link href={`/product/${product.id}`}>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint={`${product.category} product`}
            />
          </Link>
           { product.tags.includes('new') && <Badge variant="default" className="absolute top-3 left-3 bg-primary">NEW</Badge> }
           { product.stock < 20 && <Badge variant="destructive" className="absolute top-3 right-3 z-10">LOW STOCK</Badge> }
           <Button 
                size="icon" 
                variant="ghost" 
                className={cn(
                    "absolute top-2 right-2 h-9 w-9 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 z-20",
                    isWishlisted ? "text-accent" : "text-muted-foreground"
                )}
                onClick={handleWishlistToggle}
            >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                <span className="sr-only">Add to wishlist</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex-grow">
          <p className="text-xs text-muted-foreground uppercase">{product.brand}</p>
          <CardTitle className="text-lg leading-tight font-headline mt-1 truncate">
              <Link href={`/product/${product.id}`} className="hover:text-primary">{product.name}</Link>
          </CardTitle>
        </div>
        <div className="flex items-end justify-between mt-2">
            <Rating rating={product.rating} reviewCount={product.reviewCount} />
             <div className="text-primary font-bold text-xl">
                 ৳{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
