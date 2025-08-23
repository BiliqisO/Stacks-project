"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, CheckCircle, Clock, Calendar, MapPin, User } from "lucide-react";
import { TicketQRCode, type TicketQRData } from "@/components/TicketQRCode";
import { useState } from "react";

interface TicketQRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: TicketQRData;
}

export function TicketQRDialog({ isOpen, onClose, ticketData }: TicketQRDialogProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const copyTicketInfo = async () => {
    const ticketInfo = `
🎫 EVENT TICKET
━━━━━━━━━━━━━━━━
📅 Event: ${ticketData.eventTitle}
🆔 Ticket ID: ${ticketData.ticketId}
📍 Location: ${ticketData.location}
📅 Date: ${ticketData.eventDate}
⏰ Time: ${ticketData.eventTime}
💰 Price: ${ticketData.price}
👤 Owner: ${ticketData.ownerAddress}
━━━━━━━━━━━━━━━━
Powered by EventChain on Stacks
    `.trim();

    try {
      await navigator.clipboard.writeText(ticketInfo);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) {
      console.error("QR code data URL not available");
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.download = `EventChain_Ticket_${ticketData.ticketId}_QR.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎫 Event Ticket QR Code
            <Badge variant={ticketData.used ? "secondary" : "default"}>
              {ticketData.used ? "Used" : "Valid"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Present this QR code at the event entrance for quick check-in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl shadow-sm border">
              <TicketQRCode 
                ticketData={ticketData} 
                size={200} 
                onQRGenerated={setQrDataUrl}
              />
            </div>
          </div>

          {/* Ticket Information */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{ticketData.eventTitle}</h3>
              <p className="text-sm text-muted-foreground">Ticket ID: {ticketData.ticketId}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{ticketData.eventDate} at {ticketData.eventTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{ticketData.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{formatAddress(ticketData.ownerAddress)}</span>
              </div>
              {ticketData.used && (
                <div className="flex items-center gap-2 text-amber-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Ticket has been used</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyTicketInfo}
              className="flex items-center gap-2"
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Info
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadQR}
              disabled={!qrDataUrl}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {qrDataUrl ? "Download QR" : "Generating..."}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 rounded-full p-1">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-900">Check-in Instructions:</p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• Present this QR code at the event entrance</li>
                  <li>• Event staff will scan to verify your ticket</li>
                  <li>• Arrive 15-30 minutes before the event</li>
                  <li>• Keep your ticket accessible until entry</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground text-center">
            <p>🔒 This QR code contains encrypted ticket data secured by the Stacks blockchain</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}