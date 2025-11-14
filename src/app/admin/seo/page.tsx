
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


interface SeoSettings {
  titleTemplate: string;
  metaDescription: string;
  metaKeywords: string;
}

const defaultSeoSettings: SeoSettings = {
  titleTemplate: '{pageTitle} | {storeName}',
  metaDescription: 'Your one-stop online marketplace for the best men\'s apparel.',
  metaKeywords: 'mens fashion, t-shirts, polos, shirts, online shopping',
};

export default function SeoManagementPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SeoSettings>(defaultSeoSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const settingsRef = doc(firestore, 'settings', 'store');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists() && docSnap.data().seoSettings) {
                setSettings({ ...defaultSeoSettings, ...docSnap.data().seoSettings });
            }
            setIsMounted(true);
        };
        fetchSettings();
    }, []);

    const handleSettingChange = (field: keyof SeoSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            const settingsRef = doc(firestore, 'settings', 'store');
            await setDoc(settingsRef, { seoSettings: settings }, { merge: true });
            toast({
                title: "SEO Settings Saved",
                description: "Your SEO settings have been updated.",
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Save Failed",
                description: "Could not save SEO settings.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isMounted) {
        return <p>Loading SEO settings...</p>;
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2"><Globe /> SEO Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Search Engine Optimization</CardTitle>
                    <CardDescription>Manage meta tags and keywords to improve your site's ranking on search engines.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="titleTemplate">Title Template</Label>
                        <Input
                            id="titleTemplate"
                            value={settings.titleTemplate}
                            onChange={(e) => handleSettingChange('titleTemplate', e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                            Use {'{pageTitle}'} and {'{storeName}'} as placeholders.
                        </p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="metaDescription">Default Meta Description</Label>
                        <Textarea
                            id="metaDescription"
                            rows={4}
                            value={settings.metaDescription}
                            onChange={(e) => handleSettingChange('metaDescription', e.target.value)}
                        />
                         <p className="text-sm text-muted-foreground">
                            A brief summary of your store for search engine results. (Max 160 characters recommended)
                        </p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="metaKeywords">Default Meta Keywords</Label>
                        <Input
                            id="metaKeywords"
                            value={settings.metaKeywords}
                            onChange={(e) => handleSettingChange('metaKeywords', e.target.value)}
                        />
                         <p className="text-sm text-muted-foreground">
                            Comma-separated keywords relevant to your store.
                        </p>
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button onClick={handleSaveChanges} disabled={isLoading} size="lg">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save SEO Settings
                </Button>
            </div>
        </div>
    );
}
