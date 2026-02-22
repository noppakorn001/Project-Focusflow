import type { Metadata } from 'next';
import './globals.css';
import { Sidebar, SidebarContent } from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TimerLogic } from '@/components/timer-logic';
import { SyncManager } from '@/components/sync-manager';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FocusFlow',
  description: 'Premium productivity app with private Google Drive sync.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-background text-foreground">
        <TooltipProvider>
          <SyncManager />
          <div className="flex h-screen overflow-hidden">
            <aside className="hidden md:block">
              <Sidebar />
            </aside>
            
            <div className="flex flex-1 flex-col overflow-hidden">
              <header className="flex h-14 items-center border-b bg-background px-4 md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-2">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="h-full px-4 py-6">
                      <SidebarContent />
                    </div>
                  </SheetContent>
                </Sheet>
                <span className="font-bold">FocusFlow</span>
              </header>

              <main className="flex-1 overflow-y-auto bg-secondary/10 p-4 md:p-8">
                <TimerLogic />
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
