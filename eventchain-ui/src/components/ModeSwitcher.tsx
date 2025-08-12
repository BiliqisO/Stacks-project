"use client";

import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Settings } from "lucide-react";

export function ModeSwitcher() {
  const { mode, isOrganizer, switchMode, isLoading } = useMode();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex bg-muted rounded-md p-1">
        <Button
          variant={mode === "attendee" ? "default" : "ghost"}
          size="sm"
          onClick={() => switchMode("attendee")}
          className="h-8"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Attendee
        </Button>
        
        {isOrganizer && (
          <Button
            variant={mode === "organizer" ? "default" : "ghost"}
            size="sm"
            onClick={() => switchMode("organizer")}
            className="h-8"
          >
            <Settings className="h-4 w-4 mr-1" />
            Organizer
          </Button>
        )}
      </div>
      
      {isOrganizer && (
        <Badge variant="secondary" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          Verified Organizer
        </Badge>
      )}
    </div>
  );
}