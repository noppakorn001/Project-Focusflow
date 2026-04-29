'use client';

import { useStore } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Cloud, LogOut, Moon, Sun } from 'lucide-react';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { auth, googleProvider } from '@/lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const inputStyle = {
  width: '100%',
  background: 'var(--background)',
  boxShadow: 'var(--shadow-border)',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 12px',
  fontFamily: "'Geist', Arial, sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: 'var(--foreground)',
  outline: 'none',
  transition: 'box-shadow 0.15s ease',
};

const cardStyle = {
  background: 'var(--card)',
  boxShadow: 'var(--shadow-card)',
  borderRadius: '8px',
  padding: '28px',
  border: 'none',
};

const sectionTitleStyle = {
  fontFamily: "'Geist', Arial, sans-serif",
  fontSize: '18px',
  fontWeight: 600,
  letterSpacing: '-0.36px',
  color: 'var(--foreground)',
  margin: '0 0 4px 0',
};

const sectionDescStyle = {
  fontFamily: "'Geist', Arial, sans-serif",
  fontSize: '13px',
  color: 'var(--muted-foreground)',
  margin: 0,
};

export default function SettingsPage() {
  const { settings, darkMode, updateSettings, setDarkMode, setSyncStatus } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  // Track Firebase auth state reactively
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google — syncing enabled');
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  const handleSignOut = () => {
    confirm({
      title: 'Sign out',
      description: 'Are you sure you want to sign out? Cloud syncing will stop and your data will only be stored locally.',
      confirmLabel: 'Sign out',
      variant: 'destructive',
      onConfirm: async () => {
        await signOut(auth);
        setSyncStatus('idle');
        toast.success('Signed out — data saved locally');
      },
    });
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '40px',
            fontWeight: 600,
            letterSpacing: '-2.4px',
            lineHeight: 1.1,
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Settings
        </h1>
        <p style={{ fontFamily: "'Geist', Arial, sans-serif", fontSize: '18px', fontWeight: 400, color: 'var(--muted-foreground)', marginTop: '8px' }}>
          Customize your experience.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Timer Settings */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={sectionTitleStyle}>Timer Settings</h2>
            <p style={sectionDescStyle}>Adjust focus and break durations.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label
                htmlFor="focus-duration"
                style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '8px', fontFamily: "'Geist', sans-serif" }}
              >
                Focus (min)
              </label>
              <input
                id="focus-duration"
                type="number"
                value={settings.focusDuration}
                onChange={(e) => updateSettings({ focusDuration: Number(e.target.value) })}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
              />
            </div>
            <div>
              <label
                htmlFor="short-break"
                style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '8px', fontFamily: "'Geist', sans-serif" }}
              >
                Short Break (min)
              </label>
              <input
                id="short-break"
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) => updateSettings({ shortBreakDuration: Number(e.target.value) })}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
              />
            </div>
            <div>
              <label
                htmlFor="long-break"
                style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '8px', fontFamily: "'Geist', sans-serif" }}
              >
                Long Break (min)
              </label>
              <input
                id="long-break"
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) => updateSettings({ longBreakDuration: Number(e.target.value) })}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Label htmlFor="auto-start-breaks" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)', display: 'block' }}>
                  Auto-start Breaks
                </Label>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '2px 0 0 0' }}>Automatically start break timers</p>
              </div>
              <Switch
                id="auto-start-breaks"
                checked={settings.autoStartBreaks}
                onCheckedChange={(checked) => updateSettings({ autoStartBreaks: checked })}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Label htmlFor="auto-start-pomodoros" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)', display: 'block' }}>
                  Auto-start Pomodoros
                </Label>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '2px 0 0 0' }}>Automatically start focus sessions</p>
              </div>
              <Switch
                id="auto-start-pomodoros"
                checked={settings.autoStartPomodoros}
                onCheckedChange={(checked) => updateSettings({ autoStartPomodoros: checked })}
              />
            </div>
          </div>
        </div>

        {/* Cloud Sync */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={sectionTitleStyle}>Google Account</h2>
            <p style={sectionDescStyle}>Sign in to sync your data across devices via Firestore.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: user ? 'var(--badge-blue-bg)' : 'var(--muted)',
                  boxShadow: user ? 'rgba(10,114,239,0.2) 0px 0px 0px 1px' : 'var(--shadow-border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Cloud style={{ width: '18px', height: '18px', color: user ? 'var(--badge-blue-text)' : 'var(--muted-foreground)' }} />
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', display: 'block', fontFamily: "'Geist', sans-serif" }}>
                  {user ? user.displayName ?? 'Google Account' : 'Google Account'}
                </span>
                <span style={{ fontSize: '12px', color: user ? 'var(--badge-blue-text)' : 'var(--muted-foreground)', fontFamily: "'Geist', sans-serif" }}>
                  {user ? user.email ?? 'Connected' : 'Not signed in'}
                </span>
              </div>
            </div>

            {user ? (
              <button
                onClick={handleSignOut}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Geist', Arial, sans-serif",
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                <LogOut style={{ width: '14px', height: '14px' }} />
                Sign out
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Geist', Arial, sans-serif",
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={sectionTitleStyle}>Appearance</h2>
            <p style={sectionDescStyle}>Customize the look and feel.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'var(--muted)',
                  boxShadow: 'var(--shadow-border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {darkMode
                  ? <Moon style={{ width: '18px', height: '18px', color: 'var(--foreground)' }} />
                  : <Sun style={{ width: '18px', height: '18px', color: 'var(--muted-foreground)' }} />
                }
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', display: 'block', fontFamily: "'Geist', sans-serif" }}>
                  Dark Mode
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'Geist', sans-serif" }}>
                  {darkMode ? 'Currently enabled' : 'Currently disabled'}
                </span>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleTheme} />
          </div>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
