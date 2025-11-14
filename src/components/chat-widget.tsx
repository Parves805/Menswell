
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/chat-context';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';


const GUEST_ID_KEY = 'bazaargoGuestId';
const USER_PROFILE_KEY = 'userProfile';

interface Message {
    sender: 'user' | 'admin';
    text: string;
    timestamp: string;
}

interface MessageThread {
    threadId: string;
    userName: string;
    messages: Message[];
    lastMessageTimestamp: string;
}

export function ChatWidget() {
    const { toast } = useToast();
    const { isChatOpen, toggleChat } = useChat();
    const [messageText, setMessageText] = useState('');
    const [messageThread, setMessageThread] = useState<MessageThread | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const authStatus = localStorage.getItem('isAuthenticated');
            let userId: string | null = null;
            let userName = 'Guest';

            if (authStatus === 'true') {
                const profileJson = localStorage.getItem(USER_PROFILE_KEY);
                if (profileJson) {
                    try {
                        const profile = JSON.parse(profileJson);
                        userId = profile.savedUser?.email;
                        userName = profile.savedUser?.name || 'User';
                    } catch (e) { console.error('Failed to parse user profile', e); }
                }
            }
            
            if (!userId) {
                let guestId = localStorage.getItem(GUEST_ID_KEY);
                if (!guestId) {
                    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    localStorage.setItem(GUEST_ID_KEY, guestId);
                }
                userId = guestId;
                userName = `Guest (${guestId.slice(-4)})`;
            }

            setCurrentUser({ id: userId, name: userName });
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        
        const unsub = onSnapshot(doc(firestore, "chatThreads", currentUser.id), (doc) => {
            if (doc.exists()) {
                setMessageThread(doc.data() as MessageThread);
            } else {
                 setMessageThread({ 
                    threadId: currentUser.id, 
                    userName: currentUser.name,
                    messages: [],
                    lastMessageTimestamp: new Date().toISOString()
                });
            }
        });
        
        return () => unsub();
    }, [currentUser]);

    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [messageThread?.messages.length]);
    
    useEffect(() => {
      if (isChatOpen) {
          const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
          if (viewport) {
              setTimeout(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' }), 100);
          }
      }
    }, [isChatOpen]);

    const handleSendMessage = async () => {
        if (!messageText.trim() || !currentUser) return;
        setIsSending(true);

        const newMessage: Message = { sender: 'user', text: messageText, timestamp: new Date().toISOString() };
        
        const threadRef = doc(firestore, "chatThreads", currentUser.id);

        try {
            if (messageThread && messageThread.messages.length > 0) {
                 await updateDoc(threadRef, {
                    messages: arrayUnion(newMessage),
                    lastMessageTimestamp: newMessage.timestamp,
                });
            } else {
                await setDoc(threadRef, {
                    threadId: currentUser.id,
                    userName: currentUser.name,
                    messages: [newMessage],
                    lastMessageTimestamp: newMessage.timestamp,
                });
            }

            setMessageText('');
            toast({ title: 'Message Sent', description: 'The admin has received your message.' });
        } catch(e) {
            console.error("Failed to send message", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
            {isChatOpen && (
                 <Card className="w-80 h-[28rem] flex flex-col shadow-2xl mb-2 border">
                    <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                        <CardTitle className="text-lg">Chat with us</CardTitle>
                        <Button variant="ghost" size="icon" onClick={toggleChat}>
                            <X className="h-5 w-5"/>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-hidden">
                        <ScrollArea className="h-full" ref={scrollAreaRef}>
                            <div className="p-4 space-y-4">
                                {messageThread && messageThread.messages.length > 0 ? (
                                    messageThread.messages.map((msg, index) => (
                                        <div key={index} className={cn("flex items-end gap-2", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                                            {msg.sender === 'admin' && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>A</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn(
                                                "max-w-[80%] rounded-lg p-3 text-sm",
                                                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            )}>
                                                <p>{msg.text}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center">
                                        Have a question? Send us a message!
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <div className="p-4 border-t">
                         <div className="flex gap-2">
                            <Textarea 
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                className="h-10 min-h-10 resize-none"
                            />
                            <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()} size="icon" className="h-10 w-10 flex-shrink-0">
                                {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <Button
                size="icon"
                className="rounded-full w-16 h-16 shadow-lg"
                onClick={toggleChat}
                aria-label="Toggle chat"
            >
                {isChatOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
            </Button>
        </div>
    );
}
