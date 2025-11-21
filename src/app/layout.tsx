
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { BottomNav } from '@/components/bottom-nav';
import { ChatProvider } from '@/context/chat-context';
import { ChatWidget } from '@/components/chat-widget';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Menswell',
  description: 'Your one-stop online marketplace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"></link>
        
        {/* Meta Pixel Code */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', 'YOUR_PIXEL_ID');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}

      </head>
      <body className="font-body antialiased min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
            <WishlistProvider>
              <CartProvider>
                <ChatProvider>
                  <div className="flex flex-col min-h-screen">
                    {children}
                  </div>
                  <Toaster />
                  <BottomNav />
                  <ChatWidget />
                </ChatProvider>
              </CartProvider>
            </WishlistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
