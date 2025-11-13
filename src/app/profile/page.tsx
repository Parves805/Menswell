
'use client';

import { useState, useRef, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Camera, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


const defaultUser = {
  name: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
  },
  avatar: '',
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState(defaultUser);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
        if (isFirebaseConfigured && auth.currentUser) {
            const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({
                    name: userData.name || '',
                    email: userData.email || auth.currentUser.email || '',
                    phone: userData.phone || '',
                    address: {
                        street: userData.address?.street || '',
                        city: userData.address?.city || '',
                        state: userData.address?.state || '',
                        zip: userData.address?.zip || '',
                    },
                    avatar: userData.avatar || '',
                });
                if (userData.avatar) {
                    setProfilePic(userData.avatar);
                }
            } else {
                 setUser(prev => ({ ...prev, email: auth.currentUser?.email || '' }));
            }
        }
        setIsLoading(false);
    };
    
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, []);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nameParts = name.split('.');

    if (nameParts.length === 1) {
      setUser(prevUser => ({
        ...prevUser,
        [name]: value,
      }));
    } else if (nameParts.length === 2 && nameParts[0] === 'address') {
      const key = nameParts[1];
      setUser(prevUser => ({
        ...prevUser,
        address: {
          ...prevUser.address,
          [key]: value,
        },
      }));
    }
  };

  const handlePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in to save your profile.' });
        return;
    }
    setIsSaving(true);
    
    try {
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        const dataToSave = { ...user, avatar: profilePic || user.avatar };
        await setDoc(userDocRef, dataToSave, { merge: true });

        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        });

    } catch (error) {
       console.error("Failed to save user profile to Firestore", error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not save your profile.' });
    }

    setIsSaving(false);
  };

  const nameInitial = user.name ? user.name.charAt(0).toUpperCase() : <User className="h-12 w-12" />;

  if (isLoading) {
      return (
          <div className="flex flex-col min-h-screen">
              <SiteHeader />
              <main className="flex-grow container flex items-center justify-center">
                  <p>Loading profile...</p>
              </main>
              <SiteFooter />
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container pt-8 pb-24 md:pt-12 md:pb-12">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">My Profile</CardTitle>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={profilePic ?? undefined} alt={user.name} />
                    <AvatarFallback className="text-3xl bg-secondary">{nameInitial}</AvatarFallback>
                  </Avatar>
                  <Button 
                    type="button"
                    size="icon" 
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={triggerFileSelect}
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Change profile picture</span>
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePictureChange} 
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{user.name}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={user.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" value={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" value={user.phone} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" name="address.street" value={user.address.street} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="address.city" value={user.address.city} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="address.state" value={user.address.state} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code</Label>
                    <Input id="zip" name="address.zip" value={user.address.zip} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isSaving}>
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
          </form>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

    