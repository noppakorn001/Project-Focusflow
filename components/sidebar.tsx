'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
// Timer is used in NAV_ITEMS for the Focus Timer route icon
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
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
    
    // Trigger a manual sync by updating a timestamp or calling an API
    // Since SyncManager handles auto-sync on state change, we can just notify the user
    // or force a re-check. For now, let's just show status.
    // Ideally, we'd expose a `syncNow` function from SyncManager via context or store,
    // but for simplicity, we'll just link to settings where they can connect/disconnect.
    
    // If we want to force sync, we could update `lastSynced` in store to 0 to trigger effect?
    // But SyncManager logic is: auto-syncs on change.
    
    toast.info('Sync is handled automatically. Check Settings for connection status.');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center px-2">
        <Image
          src="/Focusflow_Logo.png"
          alt="FocusFlow"
          width={140}
          height={36}
          style={{ height: 'auto' }}
          className="object-contain"
          priority
        />
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2",
            syncStatus === 'error' && "border-destructive text-destructive hover:text-destructive"
          )}
          onClick={handleManualSync}
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : syncStatus === 'error' ? (
            <CloudOff className="h-4 w-4" />
          ) : syncStatus === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Cloud className="h-4 w-4" />
          )}
          <span className="text-xs">
            {syncStatus === 'syncing'
              ? 'Syncing...'
              : syncStatus === 'error'
              ? 'Sync Error (Retry)'
              : syncStatus === 'success'
              ? 'Cloud Synced'
              : 'Sync Idle'}
          </span>
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background px-4 py-6">
      <SidebarContent />
    </div>
  );
}
