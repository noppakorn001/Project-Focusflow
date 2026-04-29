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
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
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
  const { syncStatus } = useStore();

  const handleManualSync = async () => {
    if (syncStatus === 'syncing') return;
    toast.info('Sync is handled automatically. Check Settings for connection status.');
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

      {/* Sync Status */}
      <div
        className="mt-auto pt-4"
        style={{ borderTop: '1px solid #ebebeb' }}
      >
        <button
          onClick={handleManualSync}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'var(--card)',
            boxShadow: syncStatus === 'error'
              ? 'rgba(255,91,79,0.3) 0px 0px 0px 1px'
              : 'var(--shadow-border-light)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw style={{ width: '14px', height: '14px', color: '#0a72ef', animation: 'spin 1s linear infinite' }} />
          ) : syncStatus === 'error' ? (
            <CloudOff style={{ width: '14px', height: '14px', color: '#ff5b4f' }} />
          ) : syncStatus === 'success' ? (
            <CheckCircle2 style={{ width: '14px', height: '14px', color: '#0a72ef' }} />
          ) : (
            <Cloud style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)' }} />
          )}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: syncStatus === 'error' ? '#ff5b4f' : '#666666',
              fontFamily: "'Geist Mono', monospace",
            }}
          >
            {syncStatus === 'syncing'
              ? 'SYNCING...'
              : syncStatus === 'error'
              ? 'SYNC ERROR'
              : syncStatus === 'success'
              ? 'CLOUD SYNCED'
              : 'SYNC IDLE'}
          </span>
        </button>
      </div>
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
