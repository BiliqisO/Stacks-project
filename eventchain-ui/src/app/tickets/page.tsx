"use client";

import { useState } from "react";
import {
  QrCode,
  Send,
  Clock,
  CheckCircle,
  Calendar,
  MapPin,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTickets } from "@/hooks/useTickets";
import { useStacks } from "@/hooks/useStacks";
import { transferTicket } from "@/lib/stacks-utils";
import { WalletConnect } from "@/components/wallet-connect";
import { TicketQRDialog } from "@/components/TicketQRDialog";
import { type TicketQRData } from "@/components/TicketQRCode";

export default function TicketsPage() {
  const { tickets, transferHistory, isLoading, error, refetch } = useTickets();
  const { address, isSignedIn } = useStacks();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [transferAddress, setTransferAddress] = useState("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<any>(null);

  const handleTransfer = async () => {
    if (!selectedTicket || !transferAddress) return;

    try {
      setIsTransferring(true);
      await transferTicket(selectedTicket.id, transferAddress);
      toast.success("Ticket transfer initiated!", {
        description: `Transferring to ${transferAddress.slice(0, 6)}...${transferAddress.slice(-4)}`,
      });
      setIsTransferDialogOpen(false);
      setTransferAddress("");
      setSelectedTicket(null);
      // Refetch tickets to update UI
      refetch();
    } catch (error) {
      console.error("Transfer failed:", error);
      toast.error("Transfer failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const showQRCode = (ticket: any) => {
    console.log("Tickets page - Raw ticket data for QR:", ticket);
    
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
    
    console.log("Tickets page - Final QR data:", ticketQRData);
    
    setSelectedTicketForQR(ticketQRData);
    setQrDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "used":
        return "bg-gray-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Don't show tickets page if wallet is not connected
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">My Tickets</h1>
              <WalletConnect />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to view your tickets from the blockchain.
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Tickets</h1>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs
          defaultValue="tickets"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="history">Transfer History</TabsTrigger>
          </TabsList>

          <TabsContent
            value="tickets"
            className="space-y-6"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Loading your tickets from the blockchain...</p>
              </div>
            )}
            
            {/* Error State */}
            {error && !isLoading && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">Failed to load tickets: {error}</p>
                <Button onClick={refetch}>Retry</Button>
              </div>
            )}
            
            {/* Stats */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Tickets
                    </CardTitle>
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tickets.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Tickets
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tickets.filter((t) => t.status === "active").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Value
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tickets.reduce((total, ticket) => {
                        const price = parseFloat(ticket.priceDisplay.replace(' STX', ''));
                        return total + (isNaN(price) ? 0 : price);
                      }, 0).toFixed(2)} STX
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* No Tickets State */}
            {!isLoading && !error && tickets.length === 0 && (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Tickets Found</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any tickets yet. Purchase tickets from events to see them here.
                </p>
                <p className="text-sm text-muted-foreground">
                  Connected wallet: {address}
                </p>
              </div>
            )}
            
            {/* Tickets Grid */}
            {!isLoading && !error && tickets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="overflow-hidden"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <span className="text-sm font-medium">
                          {ticket.priceDisplay}
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">
                        {ticket.eventTitle}
                      </CardTitle>
                      <CardDescription>{ticket.ticketType}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {ticket.eventDate} at {ticket.eventTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{ticket.location}</span>
                        </div>
                      </div>

                      {/* QR Code Placeholder */}
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          QR Code: {ticket.qrCode}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p>Token ID: {ticket.tokenId}</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => showQRCode(ticket)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Show QR
                        </Button>

                        {ticket.status === "active" && (
                          <Dialog
                            open={isTransferDialogOpen}
                            onOpenChange={setIsTransferDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-transparent"
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Transfer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Transfer Ticket</DialogTitle>
                                <DialogDescription>
                                  Transfer this NFT ticket to another wallet
                                  address
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="address">
                                    Recipient Address
                                  </Label>
                                  <Input
                                    id="address"
                                    value={transferAddress}
                                    onChange={(e) =>
                                      setTransferAddress(e.target.value)
                                    }
                                    placeholder="0x..."
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsTransferDialogOpen(false)}
                                    disabled={isTransferring}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleTransfer} disabled={isTransferring || !transferAddress}>
                                    {isTransferring ? "Transferring..." : "Transfer"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download NFT
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="history"
            className="space-y-4"
          >
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground mt-4">Loading transfer history...</p>
              </div>
            )}
            
            {!isLoading && transferHistory.length === 0 && (
              <div className="text-center py-12">
                <Send className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Transfer History</h3>
                <p className="text-muted-foreground">
                  No ticket transfers found for your wallet.
                </p>
              </div>
            )}
            
            {!isLoading && transferHistory.map((transfer) => (
              <Card key={transfer.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{transfer.eventTitle}</h4>
                      <p className="text-sm text-muted-foreground">
                        {transfer.action}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{transfer.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {transfer.txHash}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>From: {transfer.from}</p>
                    <p>To: {transfer.to}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

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