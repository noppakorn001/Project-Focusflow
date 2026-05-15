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
import { Slider } from '@/components/ui/slider';

export function FocusReflectionModal() {
  const { pendingReflection, setPendingReflection, logReflection } = useStore();

  const [madeProgress, setMadeProgress] = useState<boolean | null>(null);
  const [focusQuality, setFocusQuality] = useState(3);
  const [observation, setObservation] = useState('');

  const isOpen = pendingReflection !== null;

  const handleOpenChange = (open: boolean) => {
    if (!open) handleDismiss();
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
      parentId: pendingReflection.parentId,
      madeProgress,
      focusQuality,
      observation,
      completedAt: Date.now(),
    });
    handleDismiss();
  };

  const qualityLabels: Record<number, string> = {
    1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very High',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        style={{
          background: 'var(--card)',
          boxShadow: 'var(--shadow-card-hover)',
          borderRadius: '12px',
          border: 'none',
          maxWidth: '440px',
          padding: '32px',
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: "'Geist', Arial, sans-serif",
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '-0.96px',
              color: 'var(--foreground)',
              lineHeight: 1.2,
            }}
          >
            Session Complete
          </DialogTitle>
          <DialogDescription
            style={{
              fontFamily: "'Geist', Arial, sans-serif",
              fontSize: '14px',
              color: 'var(--muted-foreground)',
              marginTop: '4px',
            }}
          >
            Take a moment to reflect on your focus session.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '8px' }}>
          {/* Task name badge */}
          {pendingReflection?.taskName && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--secondary)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '13px',
                fontWeight: 500,
                width: 'fit-content',
                fontFamily: "'Geist', Arial, sans-serif",
              }}
            >
              {pendingReflection.taskName}
            </div>
          )}

          {/* Progress question */}
          <div>
            <p
              style={{
                fontFamily: "'Geist', Arial, sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              Did you make significant progress?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setMadeProgress(true)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  background: madeProgress === true ? 'var(--foreground)' : 'transparent',
                  color: madeProgress === true ? 'var(--background)' : 'var(--foreground)',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Geist', Arial, sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setMadeProgress(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  background: madeProgress === false ? 'var(--foreground)' : 'transparent',
                  color: madeProgress === false ? 'var(--background)' : 'var(--foreground)',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Geist', Arial, sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                No
              </button>
            </div>
          </div>

          {/* Focus Quality */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: "'Geist', Arial, sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--foreground)',
                }}
              >
                Focus Quality
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                  padding: '2px 10px',
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: "'Geist Mono', monospace",
                }}
              >
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: "'Geist Mono', monospace" }}>LOW</span>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: "'Geist Mono', monospace" }}>HIGH</span>
            </div>
          </div>

          {/* Observation */}
          <div>
            <label
              htmlFor="observation"
              style={{
                display: 'block',
                fontFamily: "'Geist', Arial, sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Observation{' '}
              <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(Optional)</span>
            </label>
            <textarea
              id="observation"
              placeholder="What went well? What distracted you?"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                background: 'var(--card)',
                boxShadow: 'var(--shadow-border)',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 12px',
                fontFamily: "'Geist', Arial, sans-serif",
                fontSize: '14px',
                color: 'var(--foreground)',
                resize: 'none',
                outline: 'none',
                transition: 'box-shadow 0.15s ease',
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--card)',
              color: 'var(--muted-foreground)',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: 'pointer',
              boxShadow: 'var(--shadow-border-light)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card)')}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            Save Reflection
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
