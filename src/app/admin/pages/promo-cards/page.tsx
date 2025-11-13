
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, PlusCircle, SquareCheck } from 'lucide-react';
import type { PromoSection } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


const cardSchema = z.object({
  id: z.string(),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }),
  link: z.string().min(1, { message: "Link is required (e.g., /category/your-slug)." }),
});

const sectionSchema = z.object({
    id: z.string(),
    cards: z.array(cardSchema)
});

const formSchema = z.object({
  sections: z.array(sectionSchema),
});

type FormValues = z.infer<typeof formSchema>;

const defaultSections: PromoSection[] = [
    { 
        id: 'section_1',
        cards: [
            { id: '1', title: 'Classic Polo', imageUrl: 'https://fabrilife.com/products/650182af39a77-square.jpeg', link: '/category/polo-tshirt' },
            { id: '2', title: 'Designer Polo', imageUrl: 'https://img.drz.lazcdn.com/g/p/mdc/d08e501aee3431a41857876ab4646a5a.jpg_720x720q80.jpg', link: '/category/polo-tshirt' },
            { id: '3', title: 'Kids Polo', imageUrl: 'https://placehold.co/400x500.png', link: '/category/polo-tshirt' },
        ]
    }
];

export default function PromoCardsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { sections: [] },
    });

    const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
        control: form.control,
        name: 'sections',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const settingsRef = doc(firestore, 'settings', 'store');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists() && docSnap.data().promoCardSections) {
                form.reset({ sections: docSnap.data().promoCardSections });
            } else {
                form.reset({ sections: defaultSections });
            }
            setIsMounted(true);
        };
        fetchSettings();
    }, [form]);

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            const settingsRef = doc(firestore, 'settings', 'store');
            await setDoc(settingsRef, { promoCardSections: data.sections }, { merge: true });
            toast({
                title: "Promo Sections Saved",
                description: "Your promotional card sections have been updated.",
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Save Failed",
                description: "Could not save promo sections.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addNewSection = () => {
        appendSection({
            id: `section_${Date.now()}`,
            cards: [
                { id: `card_${Date.now()}_1`, title: 'New Promo Card', imageUrl: 'https://placehold.co/400x500.png', link: '/shop' },
            ],
        });
    };
    
    if (!isMounted) {
        return <p>Loading promo card settings...</p>;
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2"><SquareCheck /> Promo Cards</h1>
                    <p className="text-muted-foreground">Manage the promotional card sections on your homepage.</p>
                </div>
                 <Button onClick={addNewSection}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Section
                </Button>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {sectionFields.map((sectionField, sectionIndex) => (
                        <Card key={sectionField.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Section {sectionIndex + 1}</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => removeSection(sectionIndex)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Section
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <PromoSectionFields control={form.control} sectionIndex={sectionIndex} />
                            </CardContent>
                        </Card>
                    ))}
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading} size="lg">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save All Sections
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}


interface PromoSectionFieldsProps {
  control: any;
  sectionIndex: number;
}

function PromoSectionFields({ control, sectionIndex }: PromoSectionFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.cards`,
  });

  const addNewCard = () => {
    append({
      id: `card_${Date.now()}`,
      title: 'New Card',
      imageUrl: 'https://placehold.co/400x500.png',
      link: '/shop',
    });
  };

  return (
    <div className="space-y-6">
      {fields.map((cardField, cardIndex) => (
        <div key={cardField.id} className="p-4 border rounded-md space-y-4 relative">
             <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(cardIndex)}>
                <Trash2 className="h-4 w-4"/>
                <span className="sr-only">Remove Card</span>
            </Button>
            <FormField
                control={control}
                name={`sections.${sectionIndex}.cards.${cardIndex}.title`}
                render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
            />
            <FormField
                control={control}
                name={`sections.${sectionIndex}.cards.${cardIndex}.link`}
                render={({ field }) => (
                    <FormItem><FormLabel>Link URL</FormLabel><FormControl><Input {...field} placeholder="/category/slug" /></FormControl><FormMessage /></FormItem>
                )}
            />
            <FormField
                control={control}
                name={`sections.${sectionIndex}.cards.${cardIndex}.imageUrl`}
                render={({ field }) => (
                    <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}
            />
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addNewCard}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Card to Section
      </Button>
    </div>
  );
}

    
