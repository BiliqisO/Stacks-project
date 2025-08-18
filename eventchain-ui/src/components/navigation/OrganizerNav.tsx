"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";

const organizerNavItems = [
  {
    href: "/organizer/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Overview & Analytics",
  },
  {
    href: "/organizer/events",
    label: "My Events",
    icon: Calendar,
    description: "Manage Events",
  },
  {
    href: "/organizer/create",
    label: "Create Event",
    icon: Plus,
    description: "New Event",
  },
  {
    href: "/organizer/check-in",
    label: "Check-in Portal",
    icon: CheckSquare,
    description: "Manage Attendees",
  },
  {
    href: "/organizer/organizers",
    label: "Organizers",
    icon: Users,
    description: "Manage Team",
  },
];

export function OrganizerNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      <div className="px-3 py-2">
        {/* <h2 className="mb-2 px-2 text-lg font-semibold">
          Organizer Portal
        </h2> */}
        <div className="space-y-1"> 
          {organizerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto p-3"
                >
                  <div className="flex items-center w-full">
                    <Icon className="h-4 w-4 mr-3" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
