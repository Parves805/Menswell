
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Home,
  Settings,
  MessageSquare,
  ChevronDown,
  LayoutGrid,
  Bell,
  BarChart,
  Target,
  Mail,
  Menu,
  Megaphone,
  View,
  SquareCheck,
  Truck,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetHeader } from '@/components/ui/sheet';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  const areSettingsActive = [
    '/admin/settings',
    '/admin/analytics',
    '/admin/seo',
    '/admin/shipping',
  ].some(p => pathname === p);

  const areMarketingActive = [
    '/admin/marketing/email',
    '/admin/marketing/popup',
  ].some(p => pathname.startsWith(p));
  
  const arePagesActive = [
    '/admin/pages',
    '/admin/pages/homepage',
    '/admin/pages/promo-cards',
  ].some(p => pathname.startsWith(p));


  const [isSettingsOpen, setIsSettingsOpen] = useState(areSettingsActive);
  const [isMarketingOpen, setIsMarketingOpen] = useState(areMarketingActive);
  const [isPagesOpen, setIsPagesOpen] = useState(arePagesActive);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
        if (pathname !== '/admin/login') {
            router.replace('/admin/login');
        }
    }
    setIsMounted(true);
  }, [pathname, router]);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, 'chatThreads'), (snapshot) => {
        let count = 0;
        snapshot.docs.forEach(doc => {
            const thread = doc.data();
            const lastMessage = thread.messages?.[thread.messages.length - 1];
            // Simplistic check: count threads where the last message is from a user.
            // A more robust solution would track read receipts per admin.
            if (lastMessage?.sender === 'user') {
                count++;
            }
        });
        setNewMessagesCount(count);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setIsSettingsOpen(areSettingsActive);
  }, [areSettingsActive]);

  useEffect(() => {
    setIsMarketingOpen(areMarketingActive);
  }, [areMarketingActive]);

  useEffect(() => {
    setIsPagesOpen(arePagesActive);
  }, [arePagesActive]);


  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  const isActive = (path: string) => pathname === path;

  if (!isMounted) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <p>Loading...</p>
          </div>
      );
  }
  
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  if (!isAuthenticated) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <p>Redirecting to login...</p>
          </div>
      );
  }

  const mainContentClass = "flex-1 p-4 md:p-6 overflow-y-auto";

  const renderSidebarMenu = () => (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/admin')}>
          <Link href="/admin">
            <LayoutDashboard />
            Dashboard
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/admin/orders')}>
          <Link href="/admin/orders">
            <ShoppingCart />
            Orders
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/admin/products')}>
          <Link href="/admin/products">
            <Package />
            Products
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
        <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/admin/categories')}>
          <Link href="/admin/categories">
            <LayoutGrid />
            Categories
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/admin/customers')}>
          <Link href="/admin/customers">
            <Users />
            Customers
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/admin/communications')}>
          <Link href="/admin/communications">
            <MessageSquare />
            <span>Communications</span>
            {newMessagesCount > 0 && (
              <Badge className="ml-auto">{newMessagesCount}</Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive('/admin/notifications')}>
          <Link href="/admin/notifications">
            <Bell />
            <span>Notifications</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <Collapsible asChild open={isMarketingOpen} onOpenChange={setIsMarketingOpen}>
        <SidebarMenuItem className="flex flex-col">
          <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className="justify-between w-full"
                isActive={areMarketingActive}
                closeSheetOnClick={false}
              >
                <div className="flex items-center gap-2">
                  <Megaphone />
                  <span>Marketing</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isMarketingOpen && "rotate-180")} />
              </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="w-full">
            <SidebarMenu className="pl-6 pt-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/marketing/popup')}>
                    <Link href="/admin/marketing/popup">Popup Campaign</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/marketing/email')}>
                    <Link href="/admin/marketing/email">Email Marketing</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>

      <Collapsible asChild open={isPagesOpen} onOpenChange={setIsPagesOpen}>
        <SidebarMenuItem className="flex flex-col">
          <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className="justify-between w-full"
                isActive={arePagesActive}
                closeSheetOnClick={false}
              >
                <div className="flex items-center gap-2">
                  <FileText />
                  <span>Page Settings</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isPagesOpen && "rotate-180")} />
              </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="w-full">
            <SidebarMenu className="pl-6 pt-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/pages')}>
                    <Link href="/admin/pages">About & Legal</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/pages/homepage')}>
                    <Link href="/admin/pages/homepage">Homepage Sections</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/pages/promo-cards')}>
                    <Link href="/admin/pages/promo-cards">Promo Cards</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      
        <Collapsible asChild open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SidebarMenuItem className="flex flex-col">
          <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className="justify-between w-full"
                isActive={areSettingsActive}
                closeSheetOnClick={false}
              >
                <div className="flex items-center gap-2">
                  <Settings />
                  <span>Settings & Growth</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isSettingsOpen && "rotate-180")} />
              </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="w-full">
            <SidebarMenu className="pl-6 pt-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/settings')}>
                    <Link href="/admin/settings">General Settings</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/shipping')}>
                    <Link href="/admin/shipping">Shipping Rates</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/analytics')}>
                    <Link href="/admin/analytics">Analytics</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/admin/seo')}>
                    <Link href="/admin/seo">SEO Management</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary/30">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold font-headline">Admin Panel</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {renderSidebarMenu()}
          </SidebarContent>
          <SidebarFooter>
             <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                      <Link href="/">
                          <Home />
                          Back to Store
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout}>
                      <LogOut />
                      Logout
                  </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
          <div className="flex flex-col flex-1 w-full">
             <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle className="text-left sr-only">Admin Menu</SheetTitle>
                                <Link href="/" className="inline-flex items-center space-x-2">
                                    <ShoppingBag className="h-6 w-6 text-primary" />
                                    <span className="font-bold font-headline">Admin Panel</span>
                                </Link>
                        </SheetHeader>
                        {/* Re-render sidebar content inside the sheet for mobile */}
                        <SidebarContent>
                         {renderSidebarMenu()}
                        </SidebarContent>
                         <SidebarFooter>
                             <SidebarMenu>
                                <SidebarMenuItem>
                                  <SidebarMenuButton asChild>
                                      <Link href="/">
                                          <Home />
                                          Back to Store
                                      </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                                 <SidebarMenuItem>
                                  <SidebarMenuButton onClick={handleLogout}>
                                      <LogOut />
                                      Logout
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                             </SidebarMenu>
                          </SidebarFooter>
                    </SheetContent>
                </Sheet>
                <h1 className="text-lg font-semibold flex-1 text-center">Admin Menu</h1>
              </header>
              <main className={cn(mainContentClass)}>
                {children}
              </main>
          </div>
      </div>
    </SidebarProvider>
  );
}
