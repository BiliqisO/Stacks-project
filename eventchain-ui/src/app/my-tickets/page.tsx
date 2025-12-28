"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Ticket, QrCode } from "lucide-react";
import { useStacks } from "@/hooks/useStacks";
import { useTickets } from "@/hooks/useTickets";
import { TicketQRDialog } from "@/components/TicketQRDialog";
import { type TicketQRData } from "@/components/TicketQRCode";

export default function MyTicketsPage() {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<any>(null);
  const { address, isSignedIn } = useStacks();
  const { tickets, isLoading, error } = useTickets();


  const showQRCode = (ticket: any, index: number) => {
    console.log("My-tickets page - ticket data for QR:", ticket);
    
    // Use the already transformed data from useTickets hook
    const ticketQRData: TicketQRData = {
      ticketId: ticket.tokenId || `TKT-${ticket.id}`,
      eventId: ticket.id?.toString() || "0",
      eventTitle: ticket.eventTitle || "Unknown Event",
      ownerAddress: address || "",
      eventDate: ticket.eventDate || "Unknown Date",
      eventTime: ticket.eventTime || "Unknown Time",
      location: ticket.location || "TBD",
      price: ticket.priceDisplay || "0.00 STX",
      used: ticket.status === "used",
      timestamp: Math.floor(Date.now() / 1000) // Current timestamp as fallback
    };
    
    console.log("My-tickets page - Final QR data:", ticketQRData);
    
    setSelectedTicketForQR(ticketQRData);
    setQrDialogOpen(true);
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
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-4">Error loading tickets: {error}</p>
            <Button onClick={refetch}>Retry</Button>
          </CardContent>
        </Card>
      ) : tickets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket, index) => {
            return (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge variant={ticket.status === "used" ? "secondary" : "default"}>
                    {ticket.status === "used" ? "Used" : "Active"}
                  </Badge>
                </div>

                <CardHeader className="pb-4">
                  <CardTitle className="text-lg line-clamp-2 pr-16">
                    {ticket.eventTitle}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {ticket.location}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {ticket.eventDate}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      {ticket.eventTime}
                    </div>
                    <div className="flex items-center text-sm">
                      <Ticket className="h-4 w-4 mr-2" />
                      {ticket.priceDisplay}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => showQRCode(ticket, index)}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Show QR
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Open event details
                        window.open(`/event/${ticket.id}`, "_blank");
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

      {/* QR Code Dialog */}
      {selectedTicketForQR && (
        <TicketQRDialog
          isOpen={qrDialogOpen}
          onClose={() => {
            setQrDialogOpen(false);
            setSelectedTicketForQR(null);
          }}
          ticketData={selectedTicketForQR}
        />
      )}
    </div>
  );
}