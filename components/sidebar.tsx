'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/timer', label: 'Focus Timer', icon: Timer },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarContent() {
  const pathname = usePathname();
  const { syncStatus, tasks, clearUserData, startSync } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [showMergePrompt, setShowMergePrompt] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Auto-sync on page load / refresh when already logged in
        try {
          await startSync(u.uid, 'replace');
        } catch (err) {
          console.error('Auto-sync on auth state change failed:', err);
          toast.error('Sync failed — check your connection');
        }
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (tasks.length > 0) {
        setShowMergePrompt(true);
      } else {
        startSync(res.user.uid, 'replace');
      }
    } catch (error) {
      console.error(error);
      toast.error('Sign in failed');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    clearUserData();
  };

  const handleMerge = () => {
    if (!user) return;
    startSync(user.uid, 'merge');
    setShowMergePrompt(false);
  };

  const handleReplace = () => {
    if (!user) return;
    startSync(user.uid, 'replace');
    setShowMergePrompt(false);
  };

  const getSyncDotColor = () => {
    if (syncStatus === 'error') return '#ff5b4f'; // Red
    if (syncStatus === 'syncing') return '#a3a3a3'; // Grey
    return '#ffffff'; // White
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="mb-8 flex items-center px-2 gap-3">
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--card)',
          flexShrink: 0
        }}>
          <Image
            src="/Focusflow_Logo.png"
            alt="FocusFlow Icon"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
        </div>
        <span style={{
          fontFamily: "'Geist', Arial, sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '-0.32px',
          color: 'var(--foreground)'
        }}>
          FocusFlow
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                letterSpacing: isActive ? '-0.14px' : 'normal',
                color: isActive ? '#171717' : '#666666',
                background: isActive ? '#f3f3f3' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? 'var(--shadow-border-light)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '#fafafa';
                  (e.currentTarget as HTMLElement).style.color = '#171717';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#666666';
                }
              }}
            >
              <Icon
                style={{
                  width: '15px',
                  height: '15px',
                  flexShrink: 0,
                  color: isActive ? '#171717' : '#808080',
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Auth & Sync Status */}
      <div className="mt-auto pt-6" style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', filter: 'grayscale(100%)', border: '1px solid var(--border)' }}>
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="Profile" fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#e5e5e5' }} />
                )}
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '11px',
                  fontFamily: "'Geist Mono', monospace",
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                SIGN OUT
              </button>
            </div>
            
            {/* Sync Dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontFamily: "'Geist Mono', monospace", color: 'var(--muted-foreground)' }}>
                {syncStatus === 'syncing' ? 'SYNCING' : syncStatus === 'error' ? 'ERROR' : 'SYNCED'}
              </span>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getSyncDotColor(),
                  boxShadow: syncStatus === 'syncing' ? '0 0 8px rgba(163, 163, 163, 0.6)' : syncStatus === 'error' ? '0 0 8px rgba(255, 91, 79, 0.6)' : '0 0 8px rgba(255, 255, 255, 0.6)',
                  animation: syncStatus === 'syncing' ? 'pulse 1.5s infinite' : 'none',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontFamily: "'Geist Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'all 0.15s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            SIGN IN
          </button>
        )}
      </div>

      <Dialog open={showMergePrompt} onOpenChange={setShowMergePrompt}>
        <DialogContent style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', maxWidth: '400px' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Geist Mono', monospace", fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>LOCAL DATA DETECTED</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)', marginTop: '8px', fontSize: '14px', lineHeight: '1.5' }}>
              You have local tasks. Would you like to merge them with your cloud data, or replace them with the cloud version?
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
            <button
              onClick={handleMerge}
              style={{ padding: '12px', background: 'var(--foreground)', color: 'var(--background)', borderRadius: '8px', fontFamily: "'Geist Mono', monospace", fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
            >
              MERGE TO CLOUD
            </button>
            <button
              onClick={handleReplace}
              style={{ padding: '12px', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: "'Geist Mono', monospace", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              REPLACE WITH CLOUD
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Sidebar() {
  return (
    <div
      className="flex h-screen w-64 flex-col px-4 py-6"
      style={{
        background: 'var(--card)',
        boxShadow: '1px 0 0 0 rgba(0,0,0,0.08)',
      }}
    >
      <SidebarContent />
    </div>
  );
}
