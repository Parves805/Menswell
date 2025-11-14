
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { PopupCampaign } from '@/lib/types';

interface PopupModalProps {
  campaign: PopupCampaign;
  onClose: () => void;
}

export function PopupModal({ campaign, onClose }: PopupModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Timer effect for auto-closing
  useEffect(() => {
    setIsVisible(true);
    if (campaign.displayDuration > 0) {
      const durationMs = campaign.displayDuration * 1000;
      const interval = setInterval(() => {
        setProgress(p => Math.max(0, p - (100 / campaign.displayDuration / 10)));
      }, 100);

      const timer = setTimeout(() => {
        handleClose();
      }, durationMs);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [campaign.displayDuration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  if (!campaign.enabled) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          'relative w-full max-w-md m-4 transform rounded-xl bg-card text-card-foreground shadow-2xl transition-all duration-300',
           isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative aspect-video w-full">
          <Image
            src={campaign.imageUrl || 'https://placehold.co/600x400.png'}
            alt={campaign.title}
            fill
            className="object-cover rounded-t-xl"
            data-ai-hint="promotional ad"
          />
        </div>
        <div className="p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold font-headline">{campaign.title}</h2>
          <p className="text-muted-foreground">{campaign.description}</p>
          <Button asChild size="lg" className="w-full" onClick={handleClose}>
            <Link href={campaign.buttonUrl || '#'}>{campaign.buttonText}</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-secondary text-secondary-foreground"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>
        {campaign.displayDuration > 0 && (
          <Progress value={progress} className="h-1 rounded-b-xl" />
        )}
      </div>
    </div>
  );
}
