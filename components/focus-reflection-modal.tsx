'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function FocusReflectionModal() {
  const { pendingReflection, setPendingReflection, logReflection } = useStore();

  const [madeProgress, setMadeProgress] = useState<boolean | null>(null);
  const [focusQuality, setFocusQuality] = useState(3);
  const [observation, setObservation] = useState('');

  const isOpen = pendingReflection !== null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setMadeProgress(null);
    setFocusQuality(3);
    setObservation('');
    setPendingReflection(null);
  };

  const handleSubmit = () => {
    if (!pendingReflection) return;

    logReflection({
      taskId: pendingReflection.taskId,
      taskName: pendingReflection.taskName,
      madeProgress,
      focusQuality,
      observation,
      completedAt: Date.now(),
    });

    handleDismiss();
  };

  const qualityLabels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Very High',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Session Complete
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Take a moment to reflect on your focus session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Progress Question */}
          <div className="space-y-3">
            <p className="text-sm font-medium leading-snug">
              Did you make significant progress on{' '}
              <span className="text-foreground font-semibold">
                {pendingReflection?.taskName ?? 'your task'}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <Button
                variant={madeProgress === true ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setMadeProgress(true)}
              >
                Yes
              </Button>
              <Button
                variant={madeProgress === false ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setMadeProgress(false)}
              >
                No
              </Button>
            </div>
          </div>

          {/* Focus Quality Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Focus Quality</Label>
              <span className="text-sm text-muted-foreground">
                {focusQuality} — {qualityLabels[focusQuality]}
              </span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[focusQuality]}
              onValueChange={(val) => setFocusQuality(val[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 — Low</span>
              <span>5 — High</span>
            </div>
          </div>

          {/* Optional Observation */}
          <div className="space-y-2">
            <Label htmlFor="observation" className="text-sm font-medium">
              Observation{' '}
              <span className="font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="observation"
              placeholder="What went well? What distracted you?"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={handleDismiss}>
            Skip
          </Button>
          <Button size="sm" className="flex-1" onClick={handleSubmit}>
            Save Reflection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
