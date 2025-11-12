'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Product, Category } from '@/lib/types';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Label } from '@/components/ui/label';

const productSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  price: z.coerce.number().min(0, { message: 'Price must be a positive number.' }),
  stock: z.coerce.number().min(0, { message: 'Stock must be a positive number.' }),
  category: z.string().min(1, { message: 'Please select a category.' }),
  brand: z.string().min(2, { message: 'Brand is required.' }),
  images: z.array(z.object({ value: z.string().url({ message: "Please enter a valid URL." }) })).min(1, "At least one image is required."),
  sizes: z.array(z.object({ value: z.string().min(1, "Size cannot be empty.") })).optional(),
  tags: z.array(z.object({ value: z.string().min(1, "Tag cannot be empty.") })).optional(),
  colors: z.array(z.object({
    name: z.string().min(1, "Color name cannot be empty."),
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex code (e.g., #RRGGBB)."),
    image: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  })).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    const isEditMode = !!productId;

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            shortDescription: '',
            longDescription: '',
            price: 0,
            stock: 0,
            category: '',
            brand: '',
            images: [],
            sizes: [],
            tags: [],
            colors: [],
        },
    });

    const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control: form.control, name: "images" });
    const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({ control: form.control, name: "sizes" });
    const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({ control: form.control, name: "tags" });
    const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({ control: form.control, name: "colors" });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, 'categories'), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
      async function fetchProduct() {
        if (isEditMode) {
            try {
                const docRef = doc(firestore, "products", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const productToEdit = docSnap.data() as Product;
                    form.reset({
                        name: productToEdit.name,
                        shortDescription: productToEdit.shortDescription,
                        longDescription: productToEdit.longDescription,
                        price: productToEdit.price,
                        stock: productToEdit.stock,
                        category: productToEdit.category,
                        brand: productToEdit.brand,
                        images: productToEdit.images.map(val => ({ value: val })),
                        sizes: productToEdit.sizes?.map(val => ({ value: val })),
                        tags: productToEdit.tags?.map(val => ({ value: val })),
                        colors: productToEdit.colors?.map(val => ({ name: val.name, hex: val.hex, image: val.image || '' })),
                    });
                } else {
                    toast({ variant: 'destructive', title: 'Product not found' });
                    router.push('/admin/products');
                }
            } catch(e) {
                 toast({ variant: 'destructive', title: 'Failed to load product' });
            } finally {
                setIsFetching(false);
            }
        } else {
            form.reset({
                name: '',
                price: 0,
                stock: 0,
                category: '',
                brand: '',
                images: [{value: ''}],
            });
            setIsFetching(false);
        }
      }
      fetchProduct();
    }, [productId, isEditMode, form, router, toast]);

    const onSubmit = async (data: ProductFormValues) => {
        setIsLoading(true);

        const transformedData: Omit<Product, 'id' | 'rating' | 'reviewCount' | 'createdAt'> & { createdAt?: any } = {
            name: data.name,
            shortDescription: data.shortDescription || '',
            longDescription: data.longDescription || '',
            price: data.price,
            stock: data.stock,
            category: data.category,
            brand: data.brand,
            images: data.images.map(i => i.value),
            sizes: data.sizes ? data.sizes.map(s => s.value) : [],
            tags: data.tags ? data.tags.map(t => t.value) : [],
            colors: data.colors ? data.colors.map(c => {
                const colorObj: { name: string; hex: string; image?: string } = { name: c.name, hex: c.hex };
                if (c.image) {
                    colorObj.image = c.image;
                }
                return colorObj;
            }) : [],
        };
        
        try {
            if (isEditMode) {
                const productRef = doc(firestore, "products", productId);
                await setDoc(productRef, transformedData, { merge: true });
            } else {
                const newProduct: Omit<Product, 'id'> = {
                    ...transformedData,
                    rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
                    reviewCount: Math.floor(Math.random() * 200) + 20,
                    createdAt: new Date().toISOString(),
                };
                await addDoc(collection(firestore, "products"), newProduct);
            }

            toast({
                title: isEditMode ? 'Product Updated' : 'Product Created',
                description: `Product "${data.name}" has been successfully saved.`,
            });
            router.push('/admin/products');
        } catch (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not save the product.' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isFetching) {
        return <p>Loading form...</p>;
    }

    const renderArrayField = (label: string, fields: any[], removeFn: Function, appendFn: Function, placeholder: string, fieldName: string) => (
      <div className="space-y-2">
          <Label>{label}</Label>
          {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                  <FormField
                      control={form.control}
                      name={`${fieldName}.${index}.value` as const}
                      render={({ field }) => (
                          <FormItem className="flex-grow">
                              <FormControl>
                                  <Input placeholder={placeholder} {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeFn(index)}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendFn({ value: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add {label.slice(0, -1)}
          </Button>
      </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</CardTitle>
                                <CardDescription>Fill in the details for the product.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Product Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="shortDescription"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Short Description (Optional)</FormLabel>
                                            <FormControl><Textarea {...field} rows={3} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="longDescription"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Long Description (Optional, HTML Supported)</FormLabel>
                                            <FormControl><Textarea {...field} rows={8} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stock Quantity</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="brand"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Brand</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                         <Card>
                            <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderArrayField("Images", imageFields, removeImage, appendImage, "https://example.com/image.png", "images")}
                                {renderArrayField("Sizes", sizeFields, removeSize, appendSize, "e.g., M", "sizes")}
                                {renderArrayField("Tags", tagFields, removeTag, appendTag, "e.g., new", "tags")}

                                <div className="space-y-4">
                                    <Label>Colors</Label>
                                    {colorFields.map((field, index) => (
                                        <div key={field.id} className="p-4 border rounded-md space-y-4">
                                            <div className="flex items-center gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`colors.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-grow">
                                                            <FormLabel>Name</FormLabel>
                                                            <FormControl><Input placeholder="Color Name" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`colors.${index}.hex`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-grow">
                                                             <FormLabel>Hex</FormLabel>
                                                            <FormControl><Input placeholder="#000000" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="button" variant="destructive" size="icon" onClick={() => removeColor(index)} className="self-end">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                             <FormField
                                                control={form.control}
                                                name={`colors.${index}.image`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                         <FormLabel>Image URL (Optional)</FormLabel>
                                                        <FormControl><Input placeholder="Image URL for this color" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendColor({ name: '', hex: '#000000', image: '' })}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Color
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading} size="lg">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? 'Save Changes' : 'Create Product'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
