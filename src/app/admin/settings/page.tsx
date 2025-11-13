
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
import type { WebsiteSettings, PaymentGatewaySettings, ThemeSettings, AboutUsSettings, LegalPagesSettings } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';


const defaultHeroSlides = [
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

interface AiSettings {
  recommendationsEnabled: boolean;
}

const defaultWebsiteSettings: WebsiteSettings = {
  storeName: 'BazaarGo',
  logoUrl: '',
  contactEmail: 'support@bazaargo.com',
  contactPhone: '+1 (234) 567-890',
  address: '123 Bazaar Street, Dhaka, Bangladesh',
  shippingRates: [],
};

const defaultAboutUsSettings: AboutUsSettings = {
    headline: 'Welcome to BazaarGo',
    subheadline: '— Where Style Meets Confidence —',
    storyTitle: 'Our Story',
    storyText: 'BazaarGo is a young and vibrant clothing brand built for today’s generation. We design fashion that blends comfort, confidence, and creativity — made especially for students and young adults who want to look sharp without trying too hard.',
    storyImageUrl: 'https://scontent.fcgp7-1.fna.fbcdn.net/v/t39.30808-6/441006129_122158359262109539_589311497273397987_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=5f2048&_nc_eui2=AeGq_vD7gB8fU-1pMv_dJg_i0bRPk42-yObRtE-Tjb7I5rT0Z1-sA3HqU2-F5-7K8P09K7Z7n7f3z8o8y9mY8P09&_nc_ohc=8x2q8p7q8gYQ7kNvgGCtWq-&_nc_ht=scontent.fcgp7-1.fna&oh=00_AYDR_G9WjK_O8zY9g_J8oXf3e9V8k8b7c8d9g_B9a9b8A&oe=669B0B7A',
    audienceTitle: 'Our Audience',
    audienceText: 'Our target customers are 16–28-year-old school, college, and university students who believe that style is more than just what you wear — it’s how you express yourself.',
    missionTitle: 'Our Mission',
    missionText1: 'To make everyday fashion accessible, stylish, and full of attitude — empowering young people to express who they are through what they wear.',
    missionText2: 'We aim to deliver premium-quality apparel that reflects the latest trends while staying affordable for students and youth communities.',
};

const defaultLegalSettings: LegalPagesSettings = {
    returns: 'We want you to be completely satisfied with your purchase. If you\'re not happy for any reason, you can return most items for a full refund or exchange within 30 days of the delivery date.\n\n### Conditions for Return:\n* Items must be in new, unworn, and unwashed condition.\n* Original tags must still be attached.\n* Items must be returned in their original packaging.\n* Final sale items are not eligible for return or exchange.\n\n### How to Start a Return:\nTo initiate a return, please visit your "My Orders" page and select the order containing the item you wish to return. If you checked out as a guest, please contact our support team with your order number.\n\n### Refunds:\nOnce we receive and inspect your return, we will process your refund to the original payment method within 5-7 business days. You will receive an email notification once the refund has been issued.',
    terms: 'Last Updated: November 2025\nWelcome to BazaarGo. By accessing or using our website, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully before using our services...\n\n(Full default content for terms and conditions)',
    privacy: 'BazaarGo ("us", "we", or "our") operates the BazaarGo website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.\n\n### Information Collection and Use\nWe collect several different types of information for various purposes to provide and improve our Service to you. This may include, but is not limited to, your name, email address, phone number, and shipping address.\n\n(Full default content for privacy policy)',
};

const defaultAiSettings: AiSettings = {
  recommendationsEnabled: true,
};

const defaultPaymentSettings: PaymentGatewaySettings = {
  cashOnDelivery: true,
  bkash: true,
  bkashNumber: '',
  nagad: true,
  nagadNumber: '',
  rocket: false,
  rocketNumber: '',
};

const defaultThemeSettings: ThemeSettings = {
    primary: "19 89% 54%",
    background: "24 69% 93%",
    accent: "354 89% 54%",
};


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [slides, setSlides] = useState<Slide[]>([]);
    const [settings, setSettings] = useState<WebsiteSettings>(defaultWebsiteSettings);
    const [aboutUsSettings, setAboutUsSettings] = useState<AboutUsSettings>(defaultAboutUsSettings);
    const [legalSettings, setLegalSettings] = useState<LegalPagesSettings>(defaultLegalSettings);
    const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);
    const [paymentSettings, setPaymentSettings] = useState<PaymentGatewaySettings>(defaultPaymentSettings);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const settingsRef = doc(firestore, 'settings', 'store');
        const unsub = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const heroSlidesData = data.heroSliderImages || defaultHeroSlides;
                
                setSlides(heroSlidesData.map((slide: any, index: number) => ({ ...slide, id: Date.now() + index })));
                setSettings(data.websiteSettings || defaultWebsiteSettings);
                setAboutUsSettings(data.aboutUsSettings || defaultAboutUsSettings);
                setLegalSettings(data.legalPagesSettings || defaultLegalSettings);
                setAiSettings(data.aiSettings || defaultAiSettings);
                setPaymentSettings(data.paymentGatewaySettings || defaultPaymentSettings);
                setThemeSettings(data.themeSettings || defaultThemeSettings);
            } else {
                 setSlides(defaultHeroSlides.map((img, i) => ({ ...img, id: Date.now() + i })));
            }
            setIsMounted(true);
        });
        
        return () => unsub();
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

    const handleAboutUsChange = (field: keyof AboutUsSettings, value: string) => {
        setAboutUsSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleLegalChange = (field: keyof LegalPagesSettings, value: string) => {
        setLegalSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleAiSettingChange = (field: keyof AiSettings, value: boolean) => {
        setAiSettings(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentSettingChange = (field: keyof PaymentGatewaySettings, value: boolean | string) => {
        setPaymentSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleThemeSettingChange = (field: keyof ThemeSettings, value: string) => {
        setThemeSettings(prev => ({ ...prev, [field]: value }));
    }

    const addSlide = () => {
        setSlides(prevSlides => [...prevSlides, { id: Date.now(), url: '', dataAiHint: '' }]);
    };

    const removeSlide = (id: number) => {
        setSlides(prevSlides => prevSlides.filter(slide => slide.id !== id));
    };

    const saveChanges = async () => {
        setIsLoading(true);
        try {
            const settingsRef = doc(firestore, 'settings', 'store');
            const slidesToSave = slides.map(({ id, ...rest }) => rest).filter(s => s.url);
            
            await setDoc(settingsRef, {
                heroSliderImages: slidesToSave,
                websiteSettings: settings,
                aboutUsSettings: aboutUsSettings,
                legalPagesSettings: legalSettings,
                aiSettings: aiSettings,
                paymentGatewaySettings: paymentSettings,
                themeSettings: themeSettings,
            }, { merge: true });

            toast({
                title: "Settings Saved",
                description: "All changes have been updated successfully.",
            });
        } catch (error) {
            console.error("Failed to save settings to Firestore", error);
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
                            value={settings.logoUrl || ''}
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
                    <CardTitle>About Us Page Settings</CardTitle>
                    <CardDescription>Manage the content for the "About Us" page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="about-headline">Headline</Label>
                        <Input id="about-headline" value={aboutUsSettings.headline} onChange={(e) => handleAboutUsChange('headline', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-subheadline">Sub-headline</Label>
                        <Input id="about-subheadline" value={aboutUsSettings.subheadline} onChange={(e) => handleAboutUsChange('subheadline', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-story-title">Story Title</Label>
                        <Input id="about-story-title" value={aboutUsSettings.storyTitle} onChange={(e) => handleAboutUsChange('storyTitle', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-story-text">Story Text</Label>
                        <Textarea id="about-story-text" value={aboutUsSettings.storyText} onChange={(e) => handleAboutUsChange('storyText', e.target.value)} rows={4} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-story-image">Story Image URL</Label>
                        <Input id="about-story-image" value={aboutUsSettings.storyImageUrl} onChange={(e) => handleAboutUsChange('storyImageUrl', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-audience-title">Audience Title</Label>
                        <Input id="about-audience-title" value={aboutUsSettings.audienceTitle} onChange={(e) => handleAboutUsChange('audienceTitle', e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="about-audience-text">Audience Text</Label>
                        <Textarea id="about-audience-text" value={aboutUsSettings.audienceText} onChange={(e) => handleAboutUsChange('audienceText', e.target.value)} rows={3} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-mission-title">Mission Title</Label>
                        <Input id="about-mission-title" value={aboutUsSettings.missionTitle} onChange={(e) => handleAboutUsChange('missionTitle', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-mission-text1">Mission Text (Paragraph 1)</Label>
                        <Textarea id="about-mission-text1" value={aboutUsSettings.missionText1} onChange={(e) => handleAboutUsChange('missionText1', e.target.value)} rows={3} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="about-mission-text2">Mission Text (Paragraph 2)</Label>
                        <Textarea id="about-mission-text2" value={aboutUsSettings.missionText2} onChange={(e) => handleAboutUsChange('missionText2', e.target.value)} rows={3} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Legal & Policy Pages</CardTitle>
                    <CardDescription>Manage the content for your legal pages. Supports Markdown.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="returns-policy">Return Policy</Label>
                        <Textarea id="returns-policy" value={legalSettings.returns} onChange={(e) => handleLegalChange('returns', e.target.value)} rows={10} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="terms-conditions">Terms & Conditions</Label>
                        <Textarea id="terms-conditions" value={legalSettings.terms} onChange={(e) => handleLegalChange('terms', e.target.value)} rows={10} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="privacy-policy">Privacy Policy</Label>
                        <Textarea id="privacy-policy" value={legalSettings.privacy} onChange={(e) => handleLegalChange('privacy', e.target.value)} rows={10} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Theme Customization</CardTitle>
                    <CardDescription>Customize the main colors of your website. Use HSL values without the `hsl()` wrapper.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Input
                            id="primaryColor"
                            value={themeSettings.primary}
                            onChange={(e) => handleThemeSettingChange('primary', e.target.value)}
                            placeholder="e.g., 19 89% 54%"
                        />
                        <p className="text-sm text-muted-foreground">Used for buttons, links, and important elements.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <Input
                            id="backgroundColor"
                            value={themeSettings.background}
                            onChange={(e) => handleThemeSettingChange('background', e.target.value)}
                            placeholder="e.g., 24 69% 93%"
                        />
                         <p className="text-sm text-muted-foreground">The main background color of the site.</p>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <Input
                            id="accentColor"
                            value={themeSettings.accent}
                            onChange={(e) => handleThemeSettingChange('accent', e.target.value)}
                            placeholder="e.g., 354 89% 54%"
                        />
                         <p className="text-sm text-muted-foreground">Used for highlights and secondary actions.</p>
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
                                    value={paymentSettings.bkashNumber || ''}
                                    onChange={(e) => handlePaymentSettingChange('bkashNumber', e.target.value)}
                                    placeholder="e.g., 01xxxxxxxxx"
                                />
                            </div>
                        )}
                    </div>
                     <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
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
                         {paymentSettings.nagad && (
                            <div className="grid gap-2">
                                <Label htmlFor="nagadNumber">Nagad Personal Number</Label>
                                <Input
                                    id="nagadNumber"
                                    value={paymentSettings.nagadNumber || ''}
                                    onChange={(e) => handlePaymentSettingChange('nagadNumber', e.target.value)}
                                    placeholder="e.g., 01xxxxxxxxx"
                                />
                            </div>
                        )}
                    </div>
                     <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
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
                         {paymentSettings.rocket && (
                            <div className="grid gap-2">
                                <Label htmlFor="rocketNumber">Rocket Personal Number</Label>
                                <Input
                                    id="rocketNumber"
                                    value={paymentSettings.rocketNumber || ''}
                                    onChange={(e) => handlePaymentSettingChange('rocketNumber', e.target.value)}
                                    placeholder="e.g., 01xxxxxxxxx"
                                />
                            </div>
                        )}
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
