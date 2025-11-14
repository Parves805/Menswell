
'use client';

import type { PromoCard } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';

interface PromoGridProps {
  promoCards: PromoCard[];
  isLoading: boolean;
}

export function PromoGrid({ promoCards, isLoading }: PromoGridProps) {
    if (isLoading) {
        return (
            <section className="py-8 md:py-12">
                <div className="container">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </section>
        );
    }
    
    if (!promoCards || promoCards.length === 0) {
        return null;
    }

    return (
        <section className="py-8 md:py-12">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promoCards.map((card) => (
                        <Link key={card.id} href={card.link} className="group relative block overflow-hidden rounded-lg shadow-lg">
                            <div className="relative h-[28rem] w-full">
                                <Image
                                    src={card.imageUrl}
                                    alt={card.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint="fashion collection"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-6 left-6">
                                    <h3 className="text-3xl font-bold text-white font-headline">{card.title}</h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
