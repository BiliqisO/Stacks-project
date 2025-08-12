"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Ticket, Search, Heart, User } from "lucide-react";

const attendeeNavItems = [
  {
    href: "/",
    label: "Browse Events",
    icon: Search,
    description: "Discover Events",
  },
  {
    href: "/my-events",
    label: "My Events",
    icon: Calendar,
    description: "Upcoming Events",
  },
  {
    href: "/my-tickets",
    label: "My Tickets",
    icon: Ticket,
    description: "Ticket Collection",
  },
  {
    href: "/favorites",
    label: "Favorites",
    icon: Heart,
    description: "Saved Events",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    description: "Account Settings",
  },
];

export function AttendeeNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      <div className="px-3 py-2">
        {/* <h2 className="mb-2 px-2 text-lg font-semibold">
          EventChain
        </h2> */}
        <div className="space-y-1">
          {attendeeNavItems.map((item) => {
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
