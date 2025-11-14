
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/lib/types';
import { Loader2, Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, deleteDoc, doc, getDocs, query, where, setDoc, writeBatch } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const categorySchema = z.object({
    name: z.string().min(2, { message: 'Category name must be at least 2 characters.' }),
    image: z.string().url({ message: 'A valid image URL is required.' }),
    bannerImage: z.string().url({ message: 'A valid banner image URL is required.' }),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const SortableCategoryRow = ({ category }: { category: Category }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell>
                <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab">
                    <GripVertical className="h-5 w-5" />
                </Button>
            </TableCell>
            <TableCell>
                <Image
                    alt={category.name}
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={category.image || 'https://placehold.co/64x64.png'}
                    width="64"
                    data-ai-hint="product category"
                />
            </TableCell>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell className="text-right">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the category.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => (window as any).handleDeleteCategory(category.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    );
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isOrderChanged, setIsOrderChanged] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const { toast } = useToast();

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', image: '', bannerImage: '' },
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, "categories"), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            // Sort by order property, then by name
            cats.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name));
            setCategories(cats);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching categories: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch categories.' });
            setIsLoading(false);
        });

        (window as any).handleDeleteCategory = handleDeleteCategory;
        return () => {
            unsubscribe();
            delete (window as any).handleDeleteCategory;
        };
    }, [toast]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over!.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                // Update order property for saving
                return newOrder.map((item, index) => ({ ...item, order: index }));
            });
            setIsOrderChanged(true);
        }
    };
    
    const handleSaveOrder = async () => {
        setIsSavingOrder(true);
        const batch = writeBatch(firestore);
        categories.forEach((category, index) => {
            const docRef = doc(firestore, 'categories', category.id);
            batch.update(docRef, { order: index });
        });
        
        try {
            await batch.commit();
            toast({ title: 'Order Saved', description: 'Category order has been updated.' });
            setIsOrderChanged(false);
        } catch (error) {
            console.error('Error saving order:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save category order.' });
        } finally {
            setIsSavingOrder(false);
        }
    };

    const handleAddCategory = async (data: CategoryFormValues) => {
        setIsSubmitting(true);
        const newId = slugify(data.name);

        const q = query(collection(firestore, "categories"), where("id", "==", newId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            toast({
                variant: 'destructive',
                title: "Error",
                description: "A category with this slug already exists. Please choose a different name.",
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const docRef = doc(firestore, 'categories', newId);
            await setDoc(docRef, { 
                id: newId,
                name: data.name,
                image: data.image,
                bannerImage: data.bannerImage,
                order: categories.length // Add to the end
             });

            toast({
                title: "Category Added",
                description: `The category "${data.name}" has been successfully added.`,
            });
            
            setIsSubmitting(false);
            setIsAddDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error adding category: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add the category.' });
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await deleteDoc(doc(firestore, "categories", categoryId));
            toast({
                title: "Category Deleted",
                description: "The category has been successfully deleted.",
            });
        } catch (error) {
            console.error("Error deleting category: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the category.' });
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl md:text-3xl">Categories</CardTitle>
                        <CardDescription>Drag and drop to reorder. Manage your store categories here.</CardDescription>
                    </div>
                     <div className="flex gap-2">
                        {isOrderChanged && (
                            <Button onClick={handleSaveOrder} disabled={isSavingOrder}>
                                {isSavingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Order
                            </Button>
                        )}
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Category
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Category</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleAddCategory)} className="space-y-4">
                                         <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Men's T-Shirts" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="image"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Image URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://example.com/image.png" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="bannerImage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Banner Image URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://example.com/banner.png" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add Category
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 p-4 rounded-lg">
                                    <Skeleton className="h-16 w-16" />
                                    <div className="flex-grow space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                    </div>
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead className="w-[100px]">Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <SortableContext
                                    items={categories.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <TableBody>
                                        {categories.map((category) => (
                                            <SortableCategoryRow key={category.id} category={category} />
                                        ))}
                                    </TableBody>
                                </SortableContext>
                            </Table>
                        </DndContext>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
