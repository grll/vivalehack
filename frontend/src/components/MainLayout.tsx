import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ChatProvider } from '@/contexts/ChatContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <ChatProvider>
    <SidebarProvider defaultOpen={false}>
        <div className="mobile-height flex w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0 relative">
            {/* Floating sidebar trigger for mobile */}
            <div className="md:hidden absolute top-4 left-4 z-20">
              <SidebarTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </SidebarTrigger>
            </div>
            {/* Desktop sidebar trigger */}
            <div className="hidden md:block absolute top-4 left-4 z-20">
              <SidebarTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </SidebarTrigger>
            </div>
            <main className="flex-1 min-h-0 relative">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </ChatProvider>
  );
}
