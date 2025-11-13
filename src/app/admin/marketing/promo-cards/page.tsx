
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PromoCardsRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/admin/pages/promo-cards');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <p>Redirecting to the new Promo Cards page...</p>
        </div>
    );
}
