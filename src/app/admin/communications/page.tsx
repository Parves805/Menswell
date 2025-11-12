'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';


const ADMIN_LAST_SEEN_KEY = 'bazaargoAdminLastSeenCounts';

interface Message {
    sender: 'user' | 'admin';
    text: string;
    timestamp: string;
}

interface UserThread {
    threadId: string;
    userName: string;
    messages: Message[];
    lastMessageTimestamp: string;
    unreadCount: number;
}

const formatTimestamp = (timestamp: string) => {
    try {
        const date = parseISO(timestamp);
        if (isToday(date)) {
            return format(date, 'p'); // e.g., 2:30 PM
        }
        if (isYesterday(date)) {
            return 'Yesterday';
        }
        return format(date, 'MMM d'); // e.g., 'Nov 5'
    } catch (e) {
        return "Invalid date";
    }
}

export default function CommunicationsPage() {
    const { toast } = useToast();
    const [threads, setThreads] = useState<UserThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<UserThread | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(firestore, 'chatThreads'), (snapshot) => {
            try {
                const allThreads = snapshot.docs.map(doc => doc.data());

                const lastSeenCountsJson = localStorage.getItem(ADMIN_LAST_SEEN_KEY);
                const lastSeenCounts = lastSeenCountsJson ? JSON.parse(lastSeenCountsJson) : {};
                
                const loadedThreads: UserThread[] = allThreads.map((thread: any) => {
                    const totalMessages = thread.messages?.length || 0;
                    if (totalMessages === 0) return null; // Don't show empty threads
                    const seenCount = lastSeenCounts[thread.threadId] || 0;
                    return {
                        ...thread,
                        unreadCount: totalMessages - seenCount,
                    };
                }).filter((t): t is UserThread => t !== null);

                loadedThreads.sort((a, b) => {
                    try {
                        return parseISO(b.lastMessageTimestamp).getTime() - parseISO(a.lastMessageTimestamp).getTime()
                    } catch {
                        return 0;
                    }
                });
                
                setThreads(loadedThreads);

                if (selectedThread) {
                    const updatedSelectedThread = loadedThreads.find(t => t.threadId === selectedThread.threadId);
                    setSelectedThread(updatedSelectedThread || null);
                }

            } catch (error) {
                console.error("Failed to load threads", error);
            }
        });

        return () => unsub();
    }, [selectedThread]);

    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }), 100);
        }
    }, [selectedThread, selectedThread?.messages.length]);

    const handleSelectThread = (thread: UserThread) => {
        setSelectedThread(thread);
        try {
            const lastSeenCountsJson = localStorage.getItem(ADMIN_LAST_SEEN_KEY);
            const lastSeenCounts = lastSeenCountsJson ? JSON.parse(lastSeenCountsJson) : {};
            lastSeenCounts[thread.threadId] = thread.messages.length;
            localStorage.setItem(ADMIN_LAST_SEEN_KEY, JSON.stringify(lastSeenCounts));

            // Optimistic update for immediate UI feedback
            setThreads(prev => prev.map(t => t.threadId === thread.threadId ? { ...t, unreadCount: 0 } : t));
        } catch (e) {
            console.error("Failed to update seen count", e);
        }
    };

    const handleReply = async () => {
        if (!replyMessage.trim() || !selectedThread) return;
        setIsReplying(true);

        const newReply: Message = { sender: 'admin', text: replyMessage, timestamp: new Date().toISOString() };
        
        const threadRef = doc(firestore, 'chatThreads', selectedThread.threadId);
        
        try {
            await updateDoc(threadRef, {
                messages: arrayUnion(newReply),
                lastMessageTimestamp: newReply.timestamp,
            });
            setReplyMessage('');
        } catch(e) {
            console.error("Failed to send reply", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send reply.' });
        } finally {
            setIsReplying(false);
        }
    }

    return (
        <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex-shrink-0">Communications</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 flex-grow min-h-0">
                
                {/* Thread List */}
                <Card className={cn("md:col-span-1 lg:col-span-1 flex flex-col", selectedThread && "hidden md:flex")}>
                    <CardHeader className="border-b">
                        <CardTitle>Inbox</CardTitle>
                        <CardDescription>{threads.length} active conversation(s)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <ScrollArea className="h-full">
                            <div className="p-2 space-y-1">
                                {threads.length > 0 ? threads.map((thread) => (
                                    <button 
                                        key={thread.threadId} 
                                        onClick={() => handleSelectThread(thread)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
                                            selectedThread?.threadId === thread.threadId ? "bg-muted" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{thread.userName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-semibold truncate">{thread.userName}</p>
                                            <p className="text-sm text-muted-foreground truncate">{thread.messages[thread.messages.length - 1].text}</p>
                                        </div>
                                        <div className="flex flex-col items-end text-xs text-muted-foreground gap-1.5 flex-shrink-0">
                                            <span>{formatTimestamp(thread.lastMessageTimestamp)}</span>
                                            {thread.unreadCount > 0 && <Badge className="w-5 h-5 flex items-center justify-center p-0">{thread.unreadCount}</Badge>}
                                        </div>
                                    </button>
                                )) : (
                                    <div className="text-center p-8 text-muted-foreground">No messages yet.</div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Message View */}
                <Card className={cn("md:col-span-2 lg:col-span-3 flex flex-col", !selectedThread && "hidden md:flex")}>
                    {selectedThread ? (
                        <>
                            <CardHeader className="flex flex-row items-center gap-3 border-b">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedThread(null)}>
                                    <ArrowLeft />
                                </Button>
                                <Avatar><AvatarFallback>{selectedThread.userName.charAt(0)}</AvatarFallback></Avatar>
                                <div>
                                    <CardTitle>{selectedThread.userName}</CardTitle>
                                    <CardDescription>Last active: {formatDistanceToNow(parseISO(selectedThread.lastMessageTimestamp), { addSuffix: true })}</CardDescription>
                                </div>
                            </CardHeader>
                             <CardContent className="flex-grow p-0 overflow-hidden">
                                <ScrollArea className="h-full" ref={scrollAreaRef}>
                                    <div className="p-4 space-y-4">
                                        {selectedThread.messages.map((msg, index) => (
                                            <div key={index} className={cn("flex items-end gap-2", msg.sender === 'admin' ? "justify-end" : "justify-start")}>
                                                 {msg.sender === 'user' && <Avatar className="h-8 w-8"><AvatarFallback>{selectedThread.userName.charAt(0)}</AvatarFallback></Avatar>}
                                                <div className={cn("max-w-[70%] rounded-lg p-3 text-sm", msg.sender === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                    <p>{msg.text}</p>
                                                    <p className={cn("text-xs mt-1 text-right", msg.sender === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                 {msg.sender === 'admin' && <Avatar className="h-8 w-8"><AvatarFallback>A</AvatarFallback></Avatar>}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Textarea 
                                        placeholder="Type your reply..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }}}
                                        className="min-h-10 h-10 resize-none"
                                    />
                                    <Button onClick={handleReply} disabled={isReplying || !replyMessage.trim()} size="icon" className="h-10 w-10 flex-shrink-0">
                                        {isReplying ? <Loader2 className="animate-spin" /> : <Send />}
                                        <span className="sr-only">Send</span>
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                            <MessageSquare className="h-16 w-16" />
                            <p className="text-lg">Select a conversation to start chatting.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

    
