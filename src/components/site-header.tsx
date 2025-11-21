'use client';

import { Search, User, Heart, ShoppingBag, Menu, LogIn, UserPlus, UserCircle, Settings, LogOut, ListOrdered, ShoppingCart, ChevronDown, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Category, WebsiteSettings, Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { firestore } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { debounce } from 'lodash';
import { Separator } from './ui/separator';

export function SiteHeader() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { wishlistCount } = useWishlist();
  const { totalItems } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; imageUrl?: string; timestamp: string; read: boolean }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<Partial<WebsiteSettings>>({ storeName: 'Menswell' });
  const [categories, setCategories] = useState<Category[]>([]);
  
  // States for instant search
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);


  useEffect(() => {
    setIsMounted(true);
    
    // Auth status from localStorage
    const authStatus = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(authStatus === 'true');
    const authInterval = setInterval(() => {
        const currentStatus = localStorage.getItem('isAuthenticated') === 'true';
        if(currentStatus !== isAuthenticated) {
            setIsAuthenticated(currentStatus);
        }
    }, 1000);


    // Firestore listeners
    const unsubSettings = onSnapshot(doc(firestore, "settings", "store"), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setSettings(s => ({ ...s, ...data.websiteSettings }));
        }
    });

    const unsubCategories = onSnapshot(collection(firestore, "categories"), (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubNotifications = onSnapshot(collection(firestore, "notifications"), (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
    });

    const unsubProducts = onSnapshot(collection(firestore, 'products'), (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setAllProducts(productsData);
    });

    return () => {
        clearInterval(authInterval);
        unsubSettings();
        unsubCategories();
        unsubNotifications();
        unsubProducts();
    };
  }, [isAuthenticated]);


  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query && allProducts.length > 0) {
        const lowerCaseQuery = query.toLowerCase();
        const results = allProducts.filter(product => 
            product.name.toLowerCase().includes(lowerCaseQuery) ||
            product.category.toLowerCase().includes(lowerCaseQuery) ||
            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
        ).slice(0, 5); // Limit to 5 results
        setSearchResults(results);
        if (results.length > 0) {
            setIsSearchOpen(true);
        } else {
            setIsSearchOpen(false);
        }
      } else {
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    }, 300), 
    [allProducts]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);


  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('query') as string;
    if (query) {
      setIsSearchOpen(false);
      setIsMobileSearchOpen(false);
      setSearchQuery('');
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/');
  };
  
  const handleMarkNotificationsAsRead = async () => {
      if (unreadCount === 0) return;
      try {
        const unreadNotifs = notifications.filter(n => !n.read);
        for(const notif of unreadNotifs) {
            const notifRef = doc(firestore, 'notifications', notif.id);
            await setDoc(notifRef, { read: true }, { merge: true });
        }
      } catch (e) {
        console.error("Failed to mark notifications as read", e);
      }
  }

  const logoContent = (isMobile: boolean = false) => (
    <Link href="/" className="flex items-center space-x-2 shrink-0">
      {settings.logoUrl ? (
         <div className="relative" style={{width: '120px', height: isMobile ? '24px' : '32px'}}>
            <Image src={settings.logoUrl} alt={settings.storeName || 'Menswell'} fill style={{objectFit: 'contain'}} />
         </div>
      ) : (
        <>
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">{settings.storeName || 'Menswell'}</span>
        </>
      )}
    </Link>
  );

  const notificationDropdownContent = (
    <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
            notifications.slice(0, 5).map(notification => (
                <DropdownMenuItem key={notification.id} className="flex-col items-start gap-2 p-3 focus:bg-accent cursor-default">
                    {notification.imageUrl && (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden">
                            <Image
                                src={notification.imageUrl}
                                alt="Notification Image"
                                fill
                                sizes="280px"
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="space-y-1 w-full">
                        <p className="text-sm font-medium whitespace-normal">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                        </p>
                    </div>
                </DropdownMenuItem>
            ))
        ) : (
            <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        )}
    </DropdownMenuContent>
  );

  const notificationTrigger = (
     <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-6 w-6" />
        {isMounted && unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
        )}
        <span className="sr-only">Notifications</span>
    </Button>
  );
  
  const mainMenuLinks = (
      <>
        <Link href="/" className="text-foreground transition-colors hover:text-primary">Home</Link>
        <Link href="/shop" className="text-foreground transition-colors hover:text-primary">Shop</Link>
        <Link href="/about" className="text-foreground transition-colors hover:text-primary">About Us</Link>
      </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Left Side: Logo */}
        <div className="flex items-center">
            {logoContent()}
        </div>

        {/* Right side group for desktop */}
        <div className="hidden md:flex flex-1 justify-end items-center gap-6">
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                    <form onSubmit={handleSearch} className="w-full max-w-lg relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            name="query" 
                            type="search" 
                            placeholder="Search products..." 
                            className="pl-12 h-12 text-base" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                        />
                    </form>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] mt-2 p-0" align="start">
                    <ScrollArea className="max-h-96">
                        {searchResults.length > 0 ? (
                            <div className="p-2">
                                {searchResults.map(product => (
                                    <Link key={product.id} href={`/product/${product.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent" onClick={() => setIsSearchOpen(false)}>
                                        <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded-md object-cover"/>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-medium truncate">{product.name}</p>
                                        </div>
                                        <p className="text-sm font-semibold">৳{product.price}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No products found.
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>
            <nav className="flex items-center space-x-6 text-sm font-medium">
                {mainMenuLinks}
            </nav>
            <div className="flex items-center space-x-1">
                <Button asChild variant="ghost" size="icon" className="relative">
                    <Link href="/wishlist">
                        <Heart className="h-6 w-6" />
                        {isMounted && wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
                                {wishlistCount}
                            </span>
                        )}
                        <span className="sr-only">Wishlist</span>
                    </Link>
                </Button>

                <DropdownMenu onOpenChange={(open) => { if (open) handleMarkNotificationsAsRead(); }}>
                    <DropdownMenuTrigger asChild>
                        {notificationTrigger}
                    </DropdownMenuTrigger>
                    {notificationDropdownContent}
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                        <User className="h-6 w-6" />
                        <span className="sr-only">User Menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isMounted && isAuthenticated ? (
                        <>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile">
                                <UserCircle className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/orders">
                                <ListOrdered className="mr-2 h-4 w-4" />
                                <span>My Orders</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                            </DropdownMenuItem>
                        </>
                        ) : (
                        <>
                            <DropdownMenuLabel>Welcome</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                            <Link href="/login">
                                <LogIn className="mr-2 h-4 w-4" />
                                <span>Log In</span>
                            </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                            <Link href="/signup">
                                <UserPlus className="mr-2 h-4 w-4" />
                                <span>Sign Up</span>
                            </Link>
                            </DropdownMenuItem>
                        </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button asChild variant="ghost" size="icon" className="relative">
                    <Link href="/cart">
                        <ShoppingCart className="h-6 w-6" />
                        {isMounted && totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
                            {totalItems}
                        </span>
                        )}
                        <span className="sr-only">Cart</span>
                    </Link>
                </Button>
            </div>
        </div>
        
        {/* Mobile Icons & Menu */}
        <div className="flex items-center md:hidden">
            <nav className="flex items-center">
              
              {/* Mobile Search Icon */}
              <Dialog open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
                  <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                          <Search className="h-6 w-6" />
                          <span className="sr-only">Search</span>
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="top-1/4">
                      <DialogHeader>
                          <DialogTitle>Search for products</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSearch} className="w-full relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input 
                              name="query" 
                              type="search" 
                              placeholder="What are you looking for?" 
                              className="pl-12 h-12 text-base" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              autoComplete="off"
                          />
                      </form>
                        <ScrollArea className="max-h-64 mt-2">
                          {searchResults.map(product => (
                              <Link key={product.id} href={`/product/${product.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent" onClick={() => setIsMobileSearchOpen(false)}>
                                  <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded-md object-cover"/>
                                  <div className="flex-grow overflow-hidden">
                                      <p className="font-medium truncate">{product.name}</p>
                                  </div>
                                  <p className="text-sm font-semibold">৳{product.price}</p>
                              </Link>
                          ))}
                      </ScrollArea>
                  </DialogContent>
              </Dialog>

              {/* Mobile Notification Icon */}
                <DropdownMenu onOpenChange={(open) => { if (open) handleMarkNotificationsAsRead(); }}>
                    <DropdownMenuTrigger asChild>
                      {notificationTrigger}
                    </DropdownMenuTrigger>
                    {notificationDropdownContent}
                </DropdownMenu>

               <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/cart">
                  <ShoppingCart className="h-6 w-6" />
                  {isMounted && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
                      {totalItems}
                    </span>
                  )}
                  <span className="sr-only">Cart</span>
                </Link>
              </Button>

                {/* Mobile Menu Icon */}
                <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                    <Menu />
                    <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="text-left sr-only">Main Menu</SheetTitle>
                        <SheetClose asChild>
                            {logoContent(true)}
                        </SheetClose>
                    </SheetHeader>
                    <div className="flex-grow flex flex-col">
                        <nav className="flex flex-col space-y-1 p-4">
                            <SheetClose asChild>
                                <Link href="/" className="text-lg font-medium text-foreground/80 hover:text-primary py-2">Home</Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/shop" className="text-lg font-medium text-foreground/80 hover:text-primary py-2">Shop</Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link href="/about" className="text-lg font-medium text-foreground/80 hover:text-primary py-2">About Us</Link>
                            </SheetClose>
                        </nav>
                        <Separator className="my-2" />
                        <div className="p-4 flex-shrink-0">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Categories</h3>
                        </div>
                        <ScrollArea className="flex-grow">
                            <nav className="grid gap-2 px-4 pb-4">
                                {categories.map((category) => (
                                    <SheetClose asChild key={category.id}>
                                        <Link href={`/category/${category.id}`} className="text-base text-foreground/70 hover:text-primary py-1">
                                            {category.name}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </nav>
                        </ScrollArea>
                    </div>
                </SheetContent>
                </Sheet>
            </nav>
        </div>
      </div>
      {/* Desktop Category Navigation */}
      <div className="hidden md:block border-b">
        <div className="container flex justify-center">
            <nav className="flex items-center space-x-6 text-sm font-medium h-12">
                {categories.map((category) => (
                  <Link key={category.id} href={`/category/${category.id}`} className="text-foreground transition-colors hover:text-primary">
                    {category.name}
                  </Link>
                ))}
            </nav>
        </div>
      </div>
    </header>
  );
}
