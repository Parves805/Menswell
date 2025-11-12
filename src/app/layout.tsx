
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { BottomNav } from '@/components/bottom-nav';
import { ChatProvider } from '@/context/chat-context';
import { ChatWidget } from '@/components/chat-widget';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'BazaarGo',
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
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
            <WishlistProvider>
              <CartProvider>
                <ChatProvider>
                  {children}
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

    