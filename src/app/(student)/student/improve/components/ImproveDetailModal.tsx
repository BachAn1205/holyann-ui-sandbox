'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ImproveDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: React.ReactNode;
}

export function ImproveDetailModal({ open, onOpenChange, title, content }: ImproveDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[85vh] sm:h-[88vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl border-border/80 shadow-xl [&>button]:right-6 [&>button]:top-6 [&>button]:h-9 [&>button]:w-9 [&>button]:rounded-lg"
      >
        <DialogHeader className="shrink-0 px-8 pt-8 pb-6 border-b border-border/60 bg-muted/20">
          <DialogTitle className="pr-12 text-xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ScrollArea className="h-full min-h-0 flex-1">
            <div className="px-8 py-6 pr-6 pb-8 text-muted-foreground [&_.whitespace-pre-line]:text-foreground space-y-6">
              {content}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
