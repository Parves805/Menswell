
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
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

// This function can be used to fetch settings on the server
async function getWebsiteSettings() {
    try {
        if (!firestore) return null;
        const settingsDoc = await getDoc(doc(firestore, "settings", "store"));
        if (settingsDoc.exists()) {
            return settingsDoc.data().websiteSettings || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching website settings for metadata:", error);
        return null;
    }
}

// Generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();
  const storeName = settings?.storeName || 'Menswell';
  const description = settings?.tagline || 'Your one-stop online marketplace.';
  const logoUrl = settings?.logoUrl || '/favicon.ico'; // Fallback to a default favicon

  return {
    title: storeName,
    description: description,
    icons: {
      icon: logoUrl,
    },
  };
}


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
        
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KTVBFBK2');`
          }}
        />
        {/* End Google Tag Manager */}

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
      <body className="font-body antialiased" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KTVBFBK2"
        height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>
        {/* End Google Tag Manager (noscript) */}

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
