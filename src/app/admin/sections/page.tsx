
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SectionsRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/admin/pages/homepage');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <p>Redirecting to the new Homepage Sections page...</p>
        </div>
    );
}
