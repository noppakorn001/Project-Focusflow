'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Cloud, LogOut, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, syncStatus, setSyncStatus } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
    };
    checkAuth();
  }, []);

  const handleConnectDrive = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        'google_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        toast.error('Please allow popups to connect Google Drive');
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setIsAuthenticated(true);
          toast.success('Connected to Google Drive');
          window.removeEventListener('message', handleMessage);
          // Trigger initial sync
          setSyncStatus('idle'); // Will trigger sidebar effect
        }
      };
      
      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Failed to initiate authentication');
    }
  };

  const handleDisconnectDrive = async () => {
    if (confirm('Are you sure you want to disconnect? Syncing will stop.')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setSyncStatus('idle');
      toast.success('Disconnected from Google Drive');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    // Ideally persist this in localStorage or store
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Customize your experience.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timer Settings</CardTitle>
          <CardDescription>Adjust focus and break durations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="focus-duration">Focus Duration (min)</Label>
              <Input
                id="focus-duration"
                type="number"
                value={settings.focusDuration}
                onChange={(e) => updateSettings({ focusDuration: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short-break">Short Break (min)</Label>
              <Input
                id="short-break"
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) => updateSettings({ shortBreakDuration: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="long-break">Long Break (min)</Label>
              <Input
                id="long-break"
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) => updateSettings({ longBreakDuration: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="auto-start-breaks">Auto-start Breaks</Label>
            <Switch
              id="auto-start-breaks"
              checked={settings.autoStartBreaks}
              onCheckedChange={(checked) => updateSettings({ autoStartBreaks: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="auto-start-pomodoros">Auto-start Pomodoros</Label>
            <Switch
              id="auto-start-pomodoros"
              checked={settings.autoStartPomodoros}
              onCheckedChange={(checked) => updateSettings({ autoStartPomodoros: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cloud Sync</CardTitle>
          <CardDescription>Sync your data to Google Drive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">Google Drive</span>
                <span className="text-sm text-muted-foreground">
                  {isAuthenticated ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
            {isAuthenticated ? (
              <Button variant="destructive" onClick={handleDisconnectDrive}>
                <LogOut className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnectDrive}>
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>Dark Mode</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
