'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: '#ffffff',
          boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.12) 0px 16px 48px',
          borderRadius: '12px',
          border: 'none',
          maxWidth: '400px',
          padding: '28px',
        }}
      >
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            {variant === 'destructive' && (
              <div
                style={{
                  flexShrink: 0,
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: '#fff0ef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle style={{ width: '18px', height: '18px', color: '#ff5b4f' }} />
              </div>
            )}
            <div>
              <DialogTitle
                style={{
                  fontFamily: "'Geist', Arial, sans-serif",
                  fontSize: '18px',
                  fontWeight: 600,
                  letterSpacing: '-0.36px',
                  color: '#171717',
                  margin: 0,
                }}
              >
                {title}
              </DialogTitle>
              <DialogDescription
                style={{
                  fontFamily: "'Geist', Arial, sans-serif",
                  fontSize: '14px',
                  color: '#666666',
                  marginTop: '6px',
                  lineHeight: 1.5,
                }}
              >
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#ffffff',
              color: '#666666',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: 'pointer',
              boxShadow: 'rgb(235,235,235) 0px 0px 0px 1px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: variant === 'destructive' ? '#ff5b4f' : '#171717',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: 'destructive' | 'default';
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => { },
  });

  const confirm = useCallback(
    (options: {
      title: string;
      description: string;
      confirmLabel?: string;
      variant?: 'destructive' | 'default';
      onConfirm: () => void;
    }) => {
      setState({ ...options, open: true });
    },
    []
  );

  const dialogProps = {
    open: state.open,
    onOpenChange: (open: boolean) => setState((s) => ({ ...s, open })),
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    variant: state.variant,
    onConfirm: state.onConfirm,
  };

  return { confirm, dialogProps };
}
