
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { AboutUsSettings, LegalPagesSettings } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';


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

export default function PageSettings() {
    const { toast } = useToast();
    const [aboutUsSettings, setAboutUsSettings] = useState<AboutUsSettings>(defaultAboutUsSettings);
    const [legalSettings, setLegalSettings] = useState<LegalPagesSettings>(defaultLegalSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const settingsRef = doc(firestore, 'settings', 'store');
        const unsub = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAboutUsSettings(data.aboutUsSettings || defaultAboutUsSettings);
                setLegalSettings(data.legalPagesSettings || defaultLegalSettings);
            }
            setIsMounted(true);
        });
        
        return () => unsub();
    }, []);

    const handleAboutUsChange = (field: keyof AboutUsSettings, value: string) => {
        setAboutUsSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleLegalChange = (field: keyof LegalPagesSettings, value: string) => {
        setLegalSettings(prev => ({ ...prev, [field]: value }));
    };
    
    const saveChanges = async () => {
        setIsLoading(true);
        try {
            const settingsRef = doc(firestore, 'settings', 'store');
            
            await setDoc(settingsRef, {
                aboutUsSettings: aboutUsSettings,
                legalPagesSettings: legalSettings,
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
        return <p>Loading page settings...</p>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">About & Legal Pages</h1>
            
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

            <div className="flex justify-end pt-2">
                <Button onClick={saveChanges} disabled={isLoading} size="lg">
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Save All Settings
                </Button>
            </div>
        </div>
    );
}
