
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Heart, User, LayoutGrid, ShoppingBag, UserCircle, ListOrdered, Settings, LogOut, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/context/wishlist-context';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import type { Category } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const NavLink = ({ href, pathname, children }: { href: string, pathname: string, children: React.ReactNode }) => (
  <Link href={href} className={cn(
    "flex flex-col items-center justify-center gap-1 text-xs transition-colors w-full h-full",
    pathname === href ? "text-primary" : "text-muted-foreground hover:text-primary"
  )}>
    {children}
  </Link>
);

const MenuLink = ({ href, children, onSelect }: { href: string, children: React.ReactNode, onSelect?: () => void }) => (
    <Link
        href={href}
        className="flex items-center gap-4 p-4 text-lg font-medium text-foreground/80 hover:text-primary transition-colors"
        onClick={onSelect}
    >
        {children}
    </Link>
);

export function BottomNav() {
  const pathname = usePathname();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Auth status from localStorage
    const authStatus = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(authStatus === 'true');
    const authInterval = setInterval(() => {
        const currentStatus = localStorage.getItem('isAuthenticated') === 'true';
        if(currentStatus !== isAuthenticated) {
            setIsAuthenticated(currentStatus);
        }
    }, 1000);

    const unsubCategories = onSnapshot(collection(firestore, 'categories'), (snapshot) => {
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);
    });

    return () => {
        clearInterval(authInterval);
        unsubCategories();
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    setIsAccountSheetOpen(false);
    router.push('/');
  };


  // Don't show on auth or admin pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
      return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
      <div className="grid h-full grid-cols-5 mx-auto">
        <NavLink href="/" pathname={pathname}>
          <Home className="h-6 w-6" />
          <span>Home</span>
        </NavLink>
        
        <Sheet>
          <SheetTrigger asChild>
            <button className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs transition-colors w-full h-full",
              pathname.startsWith('/category') ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}>
              <LayoutGrid className="h-6 w-6" />
              <span>Categories</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] flex flex-col rounded-t-lg">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>All Categories</SheetTitle>
            </SheetHeader>
            <nav className="flex-grow overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                {categories.map((category) => (
                  <SheetClose asChild key={category.id}>
                    <Link
                      href={`/category/${category.id}`}
                      className="group flex flex-col items-center text-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-secondary/50 transition-colors"
                    >
                      <div className="relative h-16 w-16 mb-2">
                         <Image src={category.image} alt={category.name} fill className="object-contain" />
                      </div>
                      <span className="font-medium text-sm text-center">{category.name}</span>
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <NavLink href="/shop" pathname={pathname}>
          <ShoppingBag className="h-6 w-6" />
          <span>Shop</span>
        </NavLink>

        <NavLink href="/wishlist" pathname={pathname}>
            <div className="relative">
                <Heart className="h-6 w-6" />
                {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                        {wishlistCount}
                    </span>
                )}
            </div>
          <span>Wishlist</span>
        </NavLink>
        
        <Sheet open={isAccountSheetOpen} onOpenChange={setIsAccountSheetOpen}>
          <SheetTrigger asChild>
             <button className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors w-full h-full",
                pathname.startsWith('/profile') || pathname.startsWith('/orders') || pathname.startsWith('/settings') ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}>
                <User className="h-6 w-6" />
                <span>Account</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto flex flex-col rounded-t-lg">
             <SheetHeader className="p-4 border-b text-left">
              <SheetTitle>{isAuthenticated ? 'My Account' : 'Welcome'}</SheetTitle>
            </SheetHeader>
             <nav className="flex flex-col p-2">
                 {isAuthenticated ? (
                        <>
                            <MenuLink href="/profile" onSelect={() => setIsAccountSheetOpen(false)}>
                                <UserCircle className="h-6 w-6" />
                                <span>Profile</span>
                            </MenuLink>
                            <MenuLink href="/orders" onSelect={() => setIsAccountSheetOpen(false)}>
                                <ListOrdered className="h-6 w-6" />
                                <span>My Orders</span>
                            </MenuLink>
                            <MenuLink href="/settings" onSelect={() => setIsAccountSheetOpen(false)}>
                                <Settings className="h-6 w-6" />
                                <span>Settings</span>
                            </MenuLink>
                            <Separator className="my-2" />
                            <button
                                className="flex items-center gap-4 p-4 text-lg font-medium text-destructive transition-colors w-full text-left"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-6 w-6" />
                                <span>Log Out</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <MenuLink href="/login" onSelect={() => setIsAccountSheetOpen(false)}>
                                <LogIn className="h-6 w-6" />
                                <span>Log In</span>
                            </MenuLink>
                             <MenuLink href="/signup" onSelect={() => setIsAccountSheetOpen(false)}>
                                <UserPlus className="h-6 w-6" />
                                <span>Sign Up</span>
                            </MenuLink>
                        </>
                    )}
             </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
