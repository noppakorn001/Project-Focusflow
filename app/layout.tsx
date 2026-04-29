import type { Metadata } from 'next';
import './globals.css';
import { Sidebar, SidebarContent } from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TimerLogic } from '@/components/timer-logic';
import { FocusReflectionModal } from '@/components/focus-reflection-modal';
import { ThemeProvider } from '@/components/theme-provider';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FocusFlow — Premium Productivity Suite',
  description: 'A precision-engineered productivity suite. Focus sessions, task management, and analytics — all in one place.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          fontFamily: "'Geist', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
          background: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <ThemeProvider>
          <TooltipProvider>
            <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
              {/* Desktop sidebar */}
              <aside className="hidden md:block">
              <Sidebar />
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Mobile header */}
              <header
                className="flex h-14 items-center px-4 md:hidden"
                style={{
                  background: 'var(--background)',
                  boxShadow: 'var(--shadow-border)',
                }}
              >
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-3"
                      style={{
                        borderRadius: '50%',
                        boxShadow: 'var(--shadow-border-light)',
                        background: 'var(--background)',
                      }}
                    >
                      <Menu className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0" style={{ background: 'var(--background)', border: 'none', boxShadow: 'var(--shadow-card)' }}>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="h-full px-4 py-6">
                      <SidebarContent />
                    </div>
                  </SheetContent>
                </Sheet>
                <span
                  style={{
                    fontFamily: "'Geist', Arial, sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '-0.32px',
                    color: 'var(--foreground)',
                  }}
                >
                  FocusFlow
                </span>
              </header>

              <main
                className="flex-1 overflow-y-auto p-4 md:p-8"
                style={{ background: 'var(--muted)' }}
              >
                <TimerLogic />
                <FocusReflectionModal />
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </body>
    </html>
  );
}
