"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Ticket, QrCode } from "lucide-react";
import { useStacks } from "@/hooks/useStacks";
import { readUserTickets } from "@/lib/stacks-utils";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isSignedIn } = useStacks();

  useEffect(() => {
    if (address && isSignedIn) {
      loadUserTickets();
    } else {
      setTickets([]);
      setIsLoading(false);
    }
  }, [address, isSignedIn]);

  const loadUserTickets = async () => {
    try {
      setIsLoading(true);
      const userTickets = await readUserTickets(address!);
      setTickets(userTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
      setTickets([]);
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

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your tickets
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tickets</h1>
        <p className="text-muted-foreground">
          View and manage your event tickets
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tickets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket, index) => {
            const eventData = ticket.result;
            const eventName = eventData?.name || `Event ${ticket.id}`;
            const location = eventData?.location || "TBD";
            const timestamp = eventData?.timestamp || 0;
            const price = eventData?.price || 0;

            return (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge variant={ticket.isCheckedIn ? "secondary" : "default"}>
                    {ticket.isCheckedIn ? "Used" : "Active"}
                  </Badge>
                </div>

                <CardHeader className="pb-4">
                  <CardTitle className="text-lg line-clamp-2 pr-16">
                    {eventName}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {location}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(timestamp)}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatTime(timestamp)}
                    </div>
                    <div className="flex items-center text-sm">
                      <Ticket className="h-4 w-4 mr-2" />
                      {(price / 1000000).toFixed(2)} STX
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // Generate a simple ticket ID for demo
                        const ticketId = `TKT-${ticket.id}-${index + 1}`;
                        alert(`Ticket ID: ${ticketId}\n\nShow this ID at the event entrance for check-in.`);
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Show QR
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Open event details
                        window.open(`/events/${ticket.id}`, "_blank");
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Tickets Yet</CardTitle>
            <CardDescription className="text-center mb-4">
              You haven't purchased any tickets yet. Browse events to get started!
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