"use client";

import { useMode } from "@/contexts/ModeContext";
import { OrganizerNav } from "@/components/navigation/OrganizerNav";
import { AttendeeNav } from "@/components/navigation/AttendeeNav";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { WalletConnect } from "@/components/WalletConnect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { mode } = useMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="hidden md:block">
              <h1 className="text-xl font-bold">
                {mode === "organizer" ? "Organizer Portal" : "EventChain"}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ModeSwitcher />
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          w-64 border-r bg-card min-h-screen
          ${sidebarOpen ? 'block' : 'hidden'} md:block
          transition-all duration-200
        `}>
          {mode === "organizer" ? <OrganizerNav /> : <AttendeeNav />}
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-10 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}