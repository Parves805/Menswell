
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, isFirebaseConfigured, firestore } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Define keys
const ALL_USERS_KEY = 'bazaargoAllUsers';
const USER_PROFILE_KEY = 'userProfile';

const loginSchema = z.object({
  email: z.string().email({
    message: 'আপনার ইমেল ঠিকানাটি সঠিক নয়। অনুগ্রহ করে একটি সঠিক ইমেল ব্যবহার করুন।',
  }),
  password: z.string().min(1, { message: 'পাসওয়ার্ড প্রয়োজন।' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'নাম কমপক্ষে ২টি অক্ষরের হতে হবে।' }),
  email: z.string().email({
    message: 'আপনার ইমেল ঠিকানাটি সঠিক নয়। অনুগ্রহ করে একটি সঠিক ইমেল ব্যবহার করুন।',
  }),
  password: z.string().min(8, {
    message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।',
  }),
});

interface AuthFormProps {
  type: 'login' | 'signup';
}

interface User {
    name: string;
    email: string;
}

export function AuthForm({ type }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const formSchema = type === 'login' ? loginSchema : signupSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    if (!isFirebaseConfigured || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Please ask the administrator to configure Firebase credentials.',
        });
        setIsGoogleLoading(false);
        return;
    }

    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (!user.email || !user.displayName) {
             toast({
                variant: 'destructive',
                title: 'Sign-in Failed',
                description: 'Could not retrieve user information from Google.',
            });
            setIsGoogleLoading(false);
            return;
        }
        
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                name: user.displayName,
                email: user.email,
            });
        }

        const profileToSave = {
            savedUser: {
                name: user.displayName,
                email: user.email,
                phone: user.phoneNumber || '',
                address: { street: '', city: '', state: '', zip: '' },
                avatar: user.photoURL || '',
            },
            savedPic: user.photoURL || null,
        };
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileToSave));
        localStorage.setItem('isAuthenticated', 'true');
        
        toast({
            title: 'Login Successful',
            description: `Welcome, ${user.displayName}!`,
        });
        
        router.push('/');

    } catch (error: any) {
        console.error('Google Sign-in error:', error);
        let description = 'An unexpected error occurred during Google Sign-in.';
        if (error.code) {
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    description = 'The sign-in process was cancelled.';
                    break;
                case 'auth/api-key-not-valid':
                    description = 'The Firebase API Key is not valid. Please check your Firebase project settings and the .env file.';
                    break;
                case 'auth/auth-domain-config-error':
                     description = 'The Firebase authentication domain is not configured correctly. Please check your Firebase project settings.';
                     break;
                default:
                    description = `Error: ${error.message} (Code: ${error.code})`;
            }
        }
        toast({
            variant: 'destructive',
            title: 'Sign-in Failed',
            description: description,
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
     if (!isFirebaseConfigured || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Authentication is currently disabled.',
        });
        setIsLoading(false);
        return;
    }
    
    if (type === 'signup') {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;
            
            // Save user info to Firestore
            await setDoc(doc(firestore, "users", user.uid), {
                name: values.name,
                email: user.email,
            });

            // Also save to profile for auto-login
            const profileToSave = {
                savedUser: {
                    name: values.name,
                    email: user.email,
                    phone: '',
                    address: { street: '', city: '', state: '', zip: '' },
                    avatar: '',
                },
                savedPic: null,
            };
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileToSave));
            localStorage.setItem('isAuthenticated', 'true');

            toast({
                title: 'Signup Successful',
                description: 'Your account has been created.',
            });
            router.push('/');
        } catch (error: any) {
            console.error('Signup error:', error);
            const errorCode = error.code;
            let description = 'Could not create your account.';
            if (errorCode === 'auth/email-already-in-use') {
                description = 'An account with this email already exists.';
            }
            toast({ variant: 'destructive', title: 'Signup Failed', description });
        }

    } else { // Login
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            localStorage.setItem('isAuthenticated', 'true');
            toast({
                title: 'Login Successful',
                description: `Welcome back!`,
            });
            router.push('/');
        } catch (error: any) {
             console.error('Login error:', error);
             toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
        }
    }

    setIsLoading(false);
  }

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={handleGoogleSignIn} 
        disabled={isGoogleLoading || isLoading || !isFirebaseConfigured}
        title={!isFirebaseConfigured ? 'Firebase is not configured. Add your API keys to the .env.local file.' : 'Sign in with Google'}
      >
          {isGoogleLoading ? (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177.2 56.4l-63.1 61.9C338.1 97.2 296.2 80 248 80c-82.8 0-150.5 67.7-150.5 151.5s67.7 151.5 150.5 151.5c97.2 0 130.3-72.8 134.8-109.8H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          )}
          {type === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
      </Button>

      <div className="relative">
          <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
      </div>
    
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {type === 'signup' && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isLoading || isGoogleLoading}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              type === 'login' ? 'Log In' : 'Create Account'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
