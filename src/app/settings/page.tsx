
'use client';

import { useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Palette, Shield, Trash2, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function SettingsPage() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [notifications, setNotifications] = useState({
        orderUpdates: true,
        promotions: false,
        newsletter: true,
    });

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        toast({
            title: "Settings Saved",
            description: "Your preferences have been updated.",
        });
    };

    const handleDeleteAccount = async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast({
            variant: "destructive",
            title: "Account Deleted",
            description: "Your account has been permanently deleted.",
        });
        // In a real app, you would also log the user out and redirect.
    };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Settings className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="text-3xl font-bold font-headline">Settings</CardTitle>
                        <CardDescription>Manage your account and site preferences.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                {/* Notification Settings */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-xl font-semibold font-headline">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="order-updates" className="font-medium">Order Updates</Label>
                                <p className="text-sm text-muted-foreground">Receive updates on your order status.</p>
                            </div>
                            <Switch id="order-updates" checked={notifications.orderUpdates} onCheckedChange={() => handleNotificationChange('orderUpdates')} />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                             <div>
                                <Label htmlFor="promotions" className="font-medium">Promotions</Label>
                                <p className="text-sm text-muted-foreground">Get notified about sales and special offers.</p>
                            </div>
                            <Switch id="promotions" checked={notifications.promotions} onCheckedChange={() => handleNotificationChange('promotions')} />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="newsletter" className="font-medium">Newsletter</Label>
                                <p className="text-sm text-muted-foreground">Subscribe to our weekly newsletter.</p>
                            </div>
                            <Switch id="newsletter" checked={notifications.newsletter} onCheckedChange={() => handleNotificationChange('newsletter')} />
                        </div>
                    </div>
                </section>
                
                <Separator />

                {/* Account Settings */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-xl font-semibold font-headline">Account</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium mb-2">Change Password</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input type="password" placeholder="Current Password" />
                                <Input type="password" placeholder="New Password" />
                            </div>
                        </div>

                         <div>
                            <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                             <p className="text-sm text-muted-foreground mb-4">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete My Account
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Continue
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </section>

            </CardContent>
            <CardFooter className="border-t pt-6">
                 <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                    ) : (
                    'Save Changes'
                    )}
                </Button>
            </CardFooter>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
