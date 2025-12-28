"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Scan
} from "lucide-react";
import { parseTicketQR, type TicketQRData } from "@/components/TicketQRCode";
import { toast } from "sonner";

interface TicketScannerProps {
  eventId?: string;
  onTicketCheckedIn?: (ticketData: TicketQRData) => void;
}

export function TicketScanner({ eventId, onTicketCheckedIn }: TicketScannerProps) {
  const [qrInput, setQrInput] = useState("");
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    ticket?: TicketQRData;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processQRCode = async () => {
    if (!qrInput.trim()) {
      setScanResult({
        success: false,
        message: "Please enter QR code data"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Parse the QR code data
      const ticketData = parseTicketQR(qrInput.trim());
      
      if (!ticketData) {
        setScanResult({
          success: false,
          message: "Invalid QR code format"
        });
        return;
      }

      // Validate event ID if provided
      if (eventId && ticketData.eventId !== eventId) {
        setScanResult({
          success: false,
          ticket: ticketData,
          message: `Ticket is for a different event (ID: ${ticketData.eventId})`
        });
        return;
      }

      // Check if ticket is already used
      if (ticketData.used) {
        setScanResult({
          success: false,
          ticket: ticketData,
          message: "Ticket has already been used"
        });
        return;
      }

      // Validate event date (don't allow check-in for past events)
      const eventDate = new Date(ticketData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        setScanResult({
          success: false,
          ticket: ticketData,
          message: "Event date has passed"
        });
        return;
      }

      // All validations passed
      setScanResult({
        success: true,
        ticket: ticketData,
        message: "Valid ticket - Ready for check-in"
      });

      // Call the check-in callback if provided
      if (onTicketCheckedIn) {
        onTicketCheckedIn(ticketData);
      }

    } catch (error) {
      console.error("QR processing error:", error);
      setScanResult({
        success: false,
        message: "Error processing QR code"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setQrInput("");
    setScanResult(null);
  };

  const getStatusIcon = () => {
    if (!scanResult) return <QrCode className="h-6 w-6 text-muted-foreground" />;
    if (scanResult.success) return <CheckCircle className="h-6 w-6 text-green-600" />;
    return <XCircle className="h-6 w-6 text-red-600" />;
  };

  const getStatusColor = () => {
    if (!scanResult) return "";
    return scanResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50";
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Ticket Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Input */}
        <div className="space-y-2">
          <Label htmlFor="qr-input">QR Code Data</Label>
          <Textarea
            id="qr-input"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Paste QR code content here or scan with camera..."
            rows={4}
            className="font-mono text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={processQRCode} 
            disabled={isProcessing || !qrInput.trim()}
            className="flex-1"
          >
            {isProcessing ? "Processing..." : "Verify Ticket"}
          </Button>
          <Button 
            variant="outline" 
            onClick={reset}
            disabled={isProcessing}
          >
            Reset
          </Button>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <Card className={`${getStatusColor()}`}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {getStatusIcon()}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={scanResult.success ? "default" : "destructive"}>
                      {scanResult.success ? "VALID" : "INVALID"}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-2">{scanResult.message}</p>
                  
                  {/* Ticket Details */}
                  {scanResult.ticket && (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Ticket ID:</span>
                          <span className="font-mono">{scanResult.ticket.ticketId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Event:</span>
                          <span>{scanResult.ticket.eventTitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Location:</span>
                          <span>{scanResult.ticket.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Date:</span>
                          <span>{scanResult.ticket.eventDate} at {scanResult.ticket.eventTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Price:</span>
                          <span>{scanResult.ticket.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">Owner:</span>
                          <span className="font-mono text-xs">
                            {scanResult.ticket.ownerAddress.slice(0, 8)}...{scanResult.ticket.ownerAddress.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Check-in Action */}
                  {scanResult.success && scanResult.ticket && (
                    <div className="mt-3 pt-3 border-t">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // Here you would typically call a function to mark the ticket as used
                          toast.success("Ticket checked in successfully!", {
                            description: `Ticket ID: ${scanResult.ticket?.ticketId}`,
                          });
                          reset();
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In Attendee
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Instructions:</p>
          <ul className="space-y-1">
            <li>• Ask attendee to show their ticket QR code</li>
            <li>• Scan with camera app or copy QR content</li>
            <li>• Paste the content above and click Verify</li>
            <li>• Check attendee ID matches the wallet address</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}