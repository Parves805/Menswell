
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

// Default user data.
const defaultUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
  },
  avatar: '', // Initially empty
};

const LOCAL_STORAGE_KEY = 'userProfile';

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState(defaultUser);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedProfile) {
        const { savedUser, savedPic } = JSON.parse(savedProfile);
        if (savedUser) {
            // Ensure address object and its properties exist
            const address = savedUser.address || {};
            setUser({
              ...defaultUser,
              ...savedUser,
              address: {
                ...defaultUser.address,
                ...address,
              },
            });
        }
        if (savedPic) setProfilePic(savedPic);
      }
    } catch (error) {
      console.error("Failed to load user profile from localStorage", error);
    }
  }, []);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nameParts = name.split('.');

    if (nameParts.length === 1) {
      // Handle top-level properties like 'name', 'phone'
      setUser(prevUser => ({
        ...prevUser,
        [name]: value,
      }));
    } else if (nameParts.length === 2 && nameParts[0] === 'address') {
      // Handle nested properties in 'address'
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
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Save to localStorage
    try {
      const profileToSave = {
        savedUser: user,
        savedPic: profilePic,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profileToSave));
    } catch (error) {
       console.error("Failed to save user profile to localStorage", error);
    }

    setIsSaving(false);
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const nameInitial = user.name ? user.name.charAt(0).toUpperCase() : <User className="h-12 w-12" />;

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
                    <AvatarImage src={profilePic ?? user.avatar} alt={user.name} />
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
                  <Input id="name" name="name" value={user.name || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" value={user.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" value={user.phone || ''} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" name="address.street" value={user.address.street || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="address.city" value={user.address.city || ''} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="address.state" value={user.address.state || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code</Label>
                    <Input id="zip" name="address.zip" value={user.address.zip || ''} onChange={handleInputChange} />
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
