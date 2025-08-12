"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useStacks } from "@/hooks/useStacks";
import { readOrganizerStatus } from "@/lib/stacks-utils";

export type AppMode = "organizer" | "attendee";

interface ModeContextType {
  mode: AppMode;
  isLoading: boolean;
  isOrganizer: boolean;
  switchMode: (mode: AppMode) => void;
  refreshOrganizerStatus: () => Promise<void>;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("attendee");
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const { address, isSignedIn } = useStacks();

  const checkOrganizerStatus = async () => {
    if (!address || !isSignedIn) {
      setIsOrganizer(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const organizerStatus = await readOrganizerStatus(address);
      setIsOrganizer(organizerStatus);
      
      // Auto-switch to organizer mode if user is an organizer
      if (organizerStatus && mode === "attendee") {
        setMode("organizer");
      }
    } catch (error) {
      console.error("Error checking organizer status:", error);
      setIsOrganizer(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganizerStatus = async () => {
    await checkOrganizerStatus();
  };

  const switchMode = (newMode: AppMode) => {
    // Only allow switching to organizer mode if user is actually an organizer
    if (newMode === "organizer" && !isOrganizer) {
      console.warn("Cannot switch to organizer mode: user is not an organizer");
      return;
    }
    setMode(newMode);
  };

  useEffect(() => {
    checkOrganizerStatus();
  }, [address, isSignedIn]);

  // Reset to attendee mode when user disconnects
  useEffect(() => {
    if (!isSignedIn) {
      setMode("attendee");
      setIsOrganizer(false);
    }
  }, [isSignedIn]);

  return (
    <ModeContext.Provider
      value={{
        mode,
        isLoading,
        isOrganizer,
        switchMode,
        refreshOrganizerStatus,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}