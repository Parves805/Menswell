'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import type { Product, Review, Order, CartItem } from '@/lib/types';
import { Star, StarHalf, Heart, Check, Minus, Plus, MessageSquare, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useChat } from '@/context/chat-context';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { QuickCheckoutDialog } from '@/components/quick-checkout-sheet';


const VIEWING_HISTORY_KEY = 'bazaargoProductViewHistory';
const MAX_HISTORY_LENGTH = 10;
const REVIEWS_KEY = 'bazaargoProductReviews';
const USER_PROFILE_KEY = 'userProfile';
const ORDERS_KEY = 'bazaargoUserOrders';

const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Please select a rating." }).max(5),
  comment: z.string().min(10, { message: "Review must be at least 10 characters." }),
});
type ReviewFormValues = z.infer<typeof reviewSchema>;


function OverallRating({ rating, reviewCount }: { rating: number, reviewCount: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`full_${i}`} className="w-5 h-5 fill-primary text-primary" />)}
        {halfStar && <StarHalf className="w-5 h-5 fill-primary text-primary" />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty_${i}`} className="w-5 h-5 text-muted-foreground/50" />)}
      </div>
      <span className="text-muted-foreground text-sm">({reviewCount} reviews)</span>
    </div>
  );
}

const StarRatingInput = ({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) => {
  const [hoverValue, setHoverValue] = useState(0);
  return (
    <div className={cn("flex items-center gap-1", disabled && "cursor-not-allowed opacity-50")}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            "h-8 w-8",
            !disabled && "cursor-pointer",
            (hoverValue || value) >= star ? "text-primary fill-primary" : "text-muted-foreground/30"
          )}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => !disabled && setHoverValue(0)}
        />
      ))}
    </div>
  );
};

export function ProductDetailsClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { setChatOpen } = useChat();
  const { toast } = useToast();
  const router = useRouter();
  
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.length > 0 ? undefined : 'N/A');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string; image?: string; } | undefined>(product.colors?.length > 0 ? undefined : {name: 'N/A', hex: ''});
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userCanReview, setUserCanReview] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null);

  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const handleSelectColor = (color: { name: string; hex: string; image?: string; }) => {
    setSelectedColor(color);
    if (color.image) {
        setActiveImage(color.image);
    }
  };

  useEffect(() => {
    try {
        const historyJson = localStorage.getItem(VIEWING_HISTORY_KEY);
        let history: string[] = historyJson ? JSON.parse(historyJson) : [];
        history = history.filter(id => id !== product.id);
        history.unshift(product.id);
        if (history.length > MAX_HISTORY_LENGTH) {
            history = history.slice(0, MAX_HISTORY_LENGTH);
        }
        localStorage.setItem(VIEWING_HISTORY_KEY, JSON.stringify(history));

        // Load reviews
        const allReviewsJson = localStorage.getItem(REVIEWS_KEY);
        const allReviews: Review[] = allReviewsJson ? JSON.parse(allReviewsJson) : [];
        const productReviews = allReviews.filter(r => r.productId === product.id);
        setReviews(productReviews);

        // Check if user can review
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        setIsLoggedIn(authStatus);
        if (authStatus) {
            const profileJson = localStorage.getItem(USER_PROFILE_KEY);
            const ordersJson = localStorage.getItem(ORDERS_KEY);
            if(profileJson && ordersJson) {
                const profile = JSON.parse(profileJson);
                const userEmail = profile.savedUser?.email;
                const orders: Order[] = JSON.parse(ordersJson);
                
                const hasPurchased = orders.some(order => 
                    order.shippingInfo.email === userEmail &&
                    order.status === 'Delivered' && // Optional: only allow reviews after delivery
                    order.items.some(item => item.id === product.id)
                );
                
                const hasAlreadyReviewed = productReviews.some(r => r.reviewerName === profile.savedUser?.name);
                setUserCanReview(hasPurchased && !hasAlreadyReviewed);
            }
        }

    } catch (error) {
        console.error('Failed to update product details state:', error);
    }
  }, [product.id]);

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' });
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({ title: 'Please select a color', variant: 'destructive' });
      return;
    }
    const { image, ...colorData } = selectedColor || {};
    addItem(product, quantity, selectedSize === 'N/A' ? undefined : selectedSize, selectedColor?.name === 'N/A' ? undefined : colorData);
  };
  
  const handleBuyNow = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' });
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({ title: 'Please select a color', variant: 'destructive' });
      return;
    }
    const { image, ...colorData } = selectedColor || {};
    const itemForCheckout: CartItem = {
      ...product,
      quantity: quantity,
      selectedSize: selectedSize === 'N/A' ? undefined : selectedSize,
      selectedColor: selectedColor?.name === 'N/A' ? undefined : colorData,
    };
    setCheckoutItem(itemForCheckout);
    setIsCheckoutDialogOpen(true);
  };

  const handleMessageSeller = () => {
    setChatOpen(true);
  };
  
  const onReviewSubmit = (data: ReviewFormValues) => {
    setIsSubmittingReview(true);
    try {
        const profileJson = localStorage.getItem(USER_PROFILE_KEY);
        if (!profileJson) throw new Error("User profile not found");
        const profile = JSON.parse(profileJson);
        const reviewerName = profile.savedUser?.name || "Anonymous";

        const newReview: Review = {
            id: `review_${Date.now()}`,
            productId: product.id,
            reviewerName,
            rating: data.rating,
            comment: data.comment,
            timestamp: new Date().toISOString(),
        };
        
        const allReviewsJson = localStorage.getItem(REVIEWS_KEY);
        const allReviews: Review[] = allReviewsJson ? JSON.parse(allReviewsJson) : [];
        const updatedReviews = [...allReviews, newReview];
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(updatedReviews));

        setReviews(prev => [...prev, newReview]);
        setUserCanReview(false); // User has now reviewed
        reviewForm.reset();
        toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
    } catch (error) {
        console.error("Failed to submit review:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not submit your review." });
    } finally {
        setIsSubmittingReview(false);
    }
  };
  
  const isWishlisted = isInWishlist(product.id);
  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : product.rating;
  const totalReviews = reviews.length + (reviews.length === 0 ? product.reviewCount : 0);


  return (
    <>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="grid gap-4">
          <div className="relative aspect-square rounded-lg overflow-hidden border">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
              data-ai-hint={`${product.category} product`}
            />
          </div>
          <div className="grid grid-cols-5 gap-4">
            {product.images.map((img, index) => (
              <button
                key={index}
                className={cn(
                  'relative aspect-square rounded-md overflow-hidden border-2 transition',
                  activeImage === img ? 'border-primary' : 'border-transparent'
                )}
                onClick={() => setActiveImage(img)}
              >
                <Image
                  src={img}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  data-ai-hint={`${product.category} product`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-4">
          <div>
              <p className="text-sm font-medium text-primary uppercase">{product.brand}</p>
              <h1 className="text-3xl md:text-4xl font-bold font-headline mt-1">{product.name}</h1>
          </div>
          <OverallRating rating={averageRating} reviewCount={totalReviews} />
          <p className="text-3xl font-bold text-primary">
              ৳{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          
          {product.shortDescription && <p className="text-muted-foreground leading-relaxed">{product.shortDescription}</p>}
          
          <div className="space-y-4">
              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-2">
                      <Label className="text-base font-semibold">Size</Label>
                      <RadioGroup
                          value={selectedSize}
                          onValueChange={setSelectedSize}
                          className="flex flex-wrap gap-2"
                      >
                          {product.sizes.map((size) => (
                          <FormItem key={size} className="flex items-center space-x-0 space-y-0">
                              <RadioGroupItem value={size} id={`size-${size}`} className="sr-only" />
                              <Label
                              htmlFor={`size-${size}`}
                              className={cn(
                                  "flex h-10 w-12 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                  selectedSize === size && "border-primary ring-2 ring-primary"
                              )}
                              >
                              {size}
                              </Label>
                          </FormItem>
                          ))}
                      </RadioGroup>
                  </div>
              )}

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                  <div className="space-y-2">
                      <Label className="text-base font-semibold">Color: <span className="font-normal text-muted-foreground">{selectedColor?.name}</span></Label>
                      <div className="flex flex-wrap gap-3">
                          {product.colors.map((color) => (
                          <button
                              key={color.name}
                              type="button"
                              className={cn(
                              "h-8 w-8 rounded-full border-2 transition",
                              selectedColor?.name === color.name ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50"
                              )}
                              style={{ backgroundColor: color.hex }}
                              onClick={() => handleSelectColor(color)}
                              aria-label={`Select color ${color.name}`}
                          />
                          ))}
                      </div>
                  </div>
              )}
          </div>

          <div className="flex items-center gap-2">
              <span className="font-semibold">Availability:</span>
              {product.stock > 0 ? (
                  <span className="text-green-600 flex items-center gap-1"><Check className="h-4 w-4" /> In Stock</span>
              ) : (
                  <span className="text-red-600">Out of Stock</span>
              )}
          </div>

          <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="icon" className="h-12" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                          <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-bold flex items-center justify-center">{quantity}</span>
                      <Button variant="ghost" size="icon" className="h-12" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>
                          <Plus className="h-4 w-4" />
                      </Button>
                  </div>
                  <div className="flex-grow" />
                  {/* Wishlist and Message */}
                  <Button size="icon" variant="outline" className="h-12 w-12" onClick={() => toggleWishlist(product)} aria-label="Toggle Wishlist">
                      <Heart className={cn("h-5 w-5", isWishlisted && "fill-current text-accent")} />
                  </Button>
                  <Button size="icon" variant="outline" className="h-12 w-12" onClick={handleMessageSeller} aria-label="Message Seller">
                      <MessageSquare className="h-5 w-5" />
                  </Button>
              </div>

              {/* Add to Cart and Buy Now */}
              <div className="flex items-stretch gap-2">
                  <Button size="lg" variant="outline" className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
                      Add to Cart
                  </Button>
                  <Button size="lg" className="flex-1" onClick={handleBuyNow} disabled={product.stock === 0}>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Buy Now
                  </Button>
              </div>
          </div>
        </div>
      </div>
      
      {/* Details & Reviews Section */}
      <div className="mt-16 pt-12 border-t">
        <h2 className="text-2xl md:text-3xl font-bold font-headline mb-6">Product Details</h2>
        {product.longDescription ? (
           <div 
              className="html-content-viewer text-muted-foreground" 
              dangerouslySetInnerHTML={{ __html: product.longDescription }} 
            />
        ) : (
          <p className="text-muted-foreground">No additional details available for this product.</p>
        )}
      </div>

      <div className="mt-16 pt-12 border-t">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold font-headline">Customer Reviews ({totalReviews})</h2>
            <div className="mt-2 md:mt-0">
                <OverallRating rating={averageRating} reviewCount={totalReviews} />
            </div>
        </div>
        <div className="space-y-8">
            {reviews.map(review => (
                <div key={review.id} className="flex gap-4">
                    <Avatar><AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">{review.reviewerName}</p>
                            <span className="text-xs text-muted-foreground">{new Date(review.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center my-1">
                            {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />)}
                        </div>
                        <p className="text-muted-foreground text-sm">{review.comment}</p>
                    </div>
                </div>
            ))}

            {reviews.length === 0 && (
                <p className="text-muted-foreground text-center py-4">This product has no reviews yet. Be the first to leave one!</p>
            )}

            <Separator />
            
            {userCanReview ? (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
                    <Form {...reviewForm}>
                        <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-6">
                             <FormField
                                control={reviewForm.control}
                                name="rating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Rating</FormLabel>
                                        <FormControl>
                                            <StarRatingInput value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={reviewForm.control}
                                name="comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Review</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={4} placeholder="Tell us what you think about the product..."/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmittingReview}>
                                {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Submit Review
                            </Button>
                        </form>
                    </Form>
                </div>
            ) : (
                 <div className="text-center text-sm text-muted-foreground p-4 bg-secondary/50 rounded-md">
                    {isLoggedIn ? 'You have already reviewed this product or must purchase it to leave a review.' : <p>Please <Link href="/login" className="text-primary hover:underline">log in</Link> and purchase this item to leave a review.</p>}
                </div>
            )}
        </div>
      </div>
      {checkoutItem && (
        <QuickCheckoutDialog
            isOpen={isCheckoutDialogOpen}
            onOpenChange={setIsCheckoutDialogOpen}
            item={checkoutItem}
        />
      )}
    </>
  );
}
