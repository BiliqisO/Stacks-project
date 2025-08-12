"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Eye } from "lucide-react";
import { useStacks } from "@/hooks/useStacks";
import { readUserTickets } from "@/lib/stacks-utils";
import Link from "next/link";

export default function MyEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isSignedIn } = useStacks();

  useEffect(() => {
    if (address && isSignedIn) {
      loadUserEvents();
    } else {
      setEvents([]);
      setIsLoading(false);
    }
  }, [address, isSignedIn]);

  const loadUserEvents = async () => {
    try {
      setIsLoading(true);
      const userTickets = await readUserTickets(address!);
      
      // Filter to get unique events and add event status
      const now = Date.now() / 1000;
      const eventsWithStatus = userTickets.map(ticket => {
        const eventData = ticket.result;
        const timestamp = eventData?.timestamp || 0;
        
        let status = "upcoming";
        if (timestamp < now) {
          status = ticket.isCheckedIn ? "attended" : "missed";
        }
        
        return {
          ...ticket,
          status
        };
      });

      setEvents(eventsWithStatus);
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "attended":
        return <Badge className="bg-green-500">Attended</Badge>;
      case "missed":
        return <Badge variant="destructive">Missed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your events
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Events</h1>
        <p className="text-muted-foreground">
          Events you're attending or have attended
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === "upcoming").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === "attended").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted animate-pulse rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event, index) => {
            const eventData = event.result;
            const eventName = eventData?.name || `Event ${event.id}`;
            const location = eventData?.location || "TBD";
            const timestamp = eventData?.timestamp || 0;
            const ticketsSold = eventData?.["tickets-sold"] || 0;
            const totalTickets = eventData?.["total-tickets"] || 0;

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{eventName}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {location}
                      </CardDescription>
                    </div>
                    {getStatusBadge(event.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{formatDate(timestamp)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(timestamp)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{ticketsSold}/{totalTickets}</p>
                        <p className="text-xs text-muted-foreground">Tickets sold</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {event.isCheckedIn ? "Checked In" : "Not Checked In"}
                        </p>
                        <p className="text-xs text-muted-foreground">Status</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Events Yet</CardTitle>
            <CardDescription className="text-center mb-4">
              You haven't purchased tickets for any events yet. Browse events to get started!
            </CardDescription>
            <Button onClick={() => window.location.href = "/"}>
              Browse Events
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}