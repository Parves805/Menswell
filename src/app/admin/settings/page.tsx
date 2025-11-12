
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const SLIDER_IMAGES_KEY = 'heroSliderImages';
const WEBSITE_SETTINGS_KEY = 'websiteSettings';
const AI_SETTINGS_KEY = 'aiSettings';
const PAYMENT_SETTINGS_KEY = 'paymentGatewaySettings';

const defaultImages = [
  { url: 'https://img.lazcdn.com/us/domino/df7d0dca-dc55-4a5c-8cb2-dcf2b2a2f1cc_BD-1976-688.jpg_2200x2200q80.jpg_.webp', dataAiHint: 'electronics sale' },
  { url: 'https://placehold.co/1200x400.png', dataAiHint: 'mens fashion' },
  { url: 'https://placehold.co/1200x400.png', dataAiHint: 'winter collection' },
  { url: 'https://placehold.co/1200x400.png', dataAiHint: 't-shirt sale' },
  { url: 'https://placehold.co/1200x400.png', dataAiHint: 'polo shirts' },
  { url: 'https://placehold.co/1200x400.png', dataAiHint: 'new arrivals' },
];

interface Slide {
  id: number;
  url: string;
  dataAiHint: string;
}

interface WebsiteSettings {
  storeName: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

interface AiSettings {
  recommendationsEnabled: boolean;
}

interface PaymentGatewaySettings {
  cashOnDelivery: boolean;
  bkash: boolean;
  bkashNumber: string;
  nagad: boolean;
  rocket: boolean;
}

const defaultSettings: WebsiteSettings = {
  storeName: 'BazaarGo',
  logoUrl: '',
  contactEmail: 'support@bazaargo.com',
  contactPhone: '+1 (234) 567-890',
  address: '123 Bazaar Street, Dhaka, Bangladesh',
};

const defaultAiSettings: AiSettings = {
  recommendationsEnabled: true,
};

const defaultPaymentSettings: PaymentGatewaySettings = {
  cashOnDelivery: true,
  bkash: true,
  bkashNumber: '',
  nagad: true,
  rocket: false,
};

// Helper function to safely parse JSON from localStorage
function safeJSONParse<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        // Basic check to ensure the parsed object has the expected keys, allows for partial saves
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...fallback, ...parsed };
        }
        return fallback;
    } catch (error) {
        console.error(`Failed to parse ${key} from localStorage`, error);
        return fallback;
    }
}


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [slides, setSlides] = useState<Slide[]>([]);
    const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
    const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);
    const [paymentSettings, setPaymentSettings] = useState<PaymentGatewaySettings>(defaultPaymentSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Load Slides
        const savedImagesJson = localStorage.getItem(SLIDER_IMAGES_KEY);
        if (savedImagesJson) {
            try {
                const savedImages = JSON.parse(savedImagesJson);
                if (Array.isArray(savedImages) && savedImages.length > 0) {
                  setSlides(savedImages.map((img: Omit<Slide, 'id'>, i: number) => ({...img, id: Date.now() + i })));
                } else {
                  setSlides(defaultImages.map((img, i) => ({ ...img, id: Date.now() + i })));
                }
            } catch {
                setSlides(defaultImages.map((img, i) => ({ ...img, id: Date.now() + i })));
            }
        } else {
            setSlides(defaultImages.map((img, i) => ({ ...img, id: Date.now() + i })));
        }

        // Load Settings
        setSettings(safeJSONParse(WEBSITE_SETTINGS_KEY, defaultSettings));
        setAiSettings(safeJSONParse(AI_SETTINGS_KEY, defaultAiSettings));
        setPaymentSettings(safeJSONParse(PAYMENT_SETTINGS_KEY, defaultPaymentSettings));
        
        setIsMounted(true);
    }, []);

    const handleSlideChange = (id: number, field: 'url' | 'dataAiHint', value: string) => {
        setSlides(prevSlides => 
            prevSlides.map(slide => 
                slide.id === id ? { ...slide, [field]: value } : slide
            )
        );
    };

    const handleSettingChange = (field: keyof WebsiteSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleAiSettingChange = (field: keyof AiSettings, value: boolean) => {
        setAiSettings(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentSettingChange = (field: keyof PaymentGatewaySettings, value: boolean | string) => {
        setPaymentSettings(prev => ({ ...prev, [field]: value }));
    };

    const addSlide = () => {
        setSlides(prevSlides => [...prevSlides, { id: Date.now(), url: '', dataAiHint: '' }]);
    };

    const removeSlide = (id: number) => {
        setSlides(prevSlides => prevSlides.filter(slide => slide.id !== id));
    };

    const saveChanges = async () => {
        setIsLoading(true);
        try {
            const slidesToSave = slides.map(({ id, ...rest }) => rest);
            localStorage.setItem(SLIDER_IMAGES_KEY, JSON.stringify(slidesToSave.filter(s => s.url)));
            localStorage.setItem(WEBSITE_SETTINGS_KEY, JSON.stringify(settings));
            localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(aiSettings));
            localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(paymentSettings));

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            toast({
                title: "Settings Saved",
                description: "All changes have been updated successfully.",
            });
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
            toast({
                variant: 'destructive',
                title: "Save Failed",
                description: "Could not save changes. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isMounted) {
        return <p>Loading settings...</p>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Website Settings</CardTitle>
                    <CardDescription>Manage general settings for your website.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                   <div className="grid gap-2">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input
                            id="storeName"
                            value={settings.storeName}
                            onChange={(e) => handleSettingChange('storeName', e.target.value)}
                            placeholder="Your Store Name"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="logoUrl">Logo URL</Label>
                        <Input
                            id="logoUrl"
                            value={settings.logoUrl}
                            onChange={(e) => handleSettingChange('logoUrl', e.target.value)}
                            placeholder="https://example.com/logo.png"
                        />
                        <p className="text-sm text-muted-foreground">
                            Enter a URL for your store logo. Leave blank to use the default icon.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                            id="contactEmail"
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                            placeholder="support@example.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                            id="contactPhone"
                            type="tel"
                            value={settings.contactPhone}
                            onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                            placeholder="+1234567890"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            value={settings.address}
                            onChange={(e) => handleSettingChange('address', e.target.value)}
                            placeholder="123 Bazaar Street, Dhaka, Bangladesh"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Hero Slider Management</CardTitle>
                    <CardDescription>Add, remove, or change images in the homepage hero slider.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {slides.map((slide) => (
                        <div key={slide.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg">
                            <Image
                                src={slide.url || 'https://placehold.co/150x150.png'}
                                alt={`Slide preview`}
                                width={100}
                                height={100}
                                className="aspect-square rounded-md object-cover border"
                                data-ai-hint={slide.dataAiHint}
                            />
                            <div className="flex-grow space-y-2 w-full">
                                <div>
                                    <Label htmlFor={`slide-url-${slide.id}`}>Image URL</Label>
                                    <Input
                                        id={`slide-url-${slide.id}`}
                                        value={slide.url}
                                        onChange={(e) => handleSlideChange(slide.id, 'url', e.target.value)}
                                        placeholder="https://example.com/image.png"
                                    />
                                </div>
                                 <div>
                                    <Label htmlFor={`slide-hint-${slide.id}`}>AI Hint (for image generation)</Label>
                                    <Input
                                        id={`slide-hint-${slide.id}`}
                                        value={slide.dataAiHint}
                                        onChange={(e) => handleSlideChange(slide.id, 'dataAiHint', e.target.value)}
                                        placeholder="e.g. mens fashion"
                                    />
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeSlide(slide.id)} className="text-destructive flex-shrink-0 mt-2 sm:mt-0">
                                <Trash2 className="h-5 w-5" />
                                <span className="sr-only">Remove slide</span>
                            </Button>
                        </div>
                    ))}
                    <div className="flex justify-start pt-4">
                        <Button variant="outline" onClick={addSlide}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Slide
                        </Button>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>AI Settings</CardTitle>
                    <CardDescription>Manage AI-powered features for your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="ai-recommendations" className="font-medium">Product Recommendations</Label>
                            <p className="text-sm text-muted-foreground">Enable or disable AI-powered product recommendations on the homepage.</p>
                        </div>
                        <Switch 
                            id="ai-recommendations" 
                            checked={aiSettings.recommendationsEnabled} 
                            onCheckedChange={(checked) => handleAiSettingChange('recommendationsEnabled', checked)} 
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Payment Gateway Settings</CardTitle>
                    <CardDescription>Enable or disable payment methods for checkout.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="pg-cash" className="font-medium">Cash on Delivery</Label>
                            <p className="text-sm text-muted-foreground">Allow customers to pay with cash upon delivery.</p>
                        </div>
                        <Switch 
                            id="pg-cash" 
                            checked={paymentSettings.cashOnDelivery} 
                            onCheckedChange={(checked) => handlePaymentSettingChange('cashOnDelivery', checked)} 
                        />
                    </div>
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="pg-bkash" className="font-medium">bKash</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to pay via bKash.</p>
                            </div>
                            <Switch 
                                id="pg-bkash" 
                                checked={paymentSettings.bkash} 
                                onCheckedChange={(checked) => handlePaymentSettingChange('bkash', checked)} 
                            />
                        </div>
                        {paymentSettings.bkash && (
                            <div className="grid gap-2">
                                <Label htmlFor="bkashNumber">bKash Personal Number</Label>
                                <Input
                                    id="bkashNumber"
                                    value={paymentSettings.bkashNumber}
                                    onChange={(e) => handlePaymentSettingChange('bkashNumber', e.target.value)}
                                    placeholder="e.g., 01xxxxxxxxx"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="pg-nagad" className="font-medium">Nagad</Label>
                            <p className="text-sm text-muted-foreground">Allow customers to pay via Nagad.</p>
                        </div>
                        <Switch 
                            id="pg-nagad" 
                            checked={paymentSettings.nagad} 
                            onCheckedChange={(checked) => handlePaymentSettingChange('nagad', checked)} 
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="pg-rocket" className="font-medium">Rocket</Label>
                            <p className="text-sm text-muted-foreground">Allow customers to pay via Rocket.</p>
                        </div>
                        <Switch 
                            id="pg-rocket" 
                            checked={paymentSettings.rocket} 
                            onCheckedChange={(checked) => handlePaymentSettingChange('rocket', checked)} 
                        />
                    </div>
                </CardContent>
            </Card>

             <div className="flex justify-end pt-2">
                <Button onClick={saveChanges} disabled={isLoading} size="lg">
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Save All Settings
                </Button>
            </div>
        </div>
    );
}
