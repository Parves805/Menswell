
'use client';

import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Testimonial } from '@/lib/types';
import { Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestimonialSliderProps {
  testimonials: Testimonial[];
}

function Rating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-5 w-5",
            i < rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}


export function TestimonialSlider({ testimonials }: TestimonialSliderProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{
        loop: true,
      }}
    >
      <CarouselContent>
        {testimonials.map((testimonial) => (
          <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-4">
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <p className="text-muted-foreground italic mb-4 flex-grow">
                    "{testimonial.text}"
                  </p>
                  <Rating rating={testimonial.rating} />
                  <div className="flex items-center gap-4 mt-4">
                    <Image
                      src={testimonial.avatarUrl}
                      alt={testimonial.author}
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="ml-12 hidden md:flex" />
      <CarouselNext className="mr-12 hidden md:flex" />
    </Carousel>
  );
}
