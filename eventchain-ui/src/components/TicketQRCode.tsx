"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface TicketQRData {
  ticketId: string; // Blockchain ticket ID
  eventId: string; // Event ID
  eventTitle: string; // Event name
  ownerAddress: string; // Current ticket owner
  eventDate: string; // Event date
  eventTime: string; // Event time
  location: string; // Event location
  price: string; // Ticket price
  used: boolean; // Whether ticket has been used
  timestamp: number; // Purchase timestamp
  signature?: string; // Optional digital signature for verification
}

interface TicketQRCodeProps {
  ticketData: TicketQRData;
  size?: number;
  className?: string;
  onQRGenerated?: (dataUrl: string) => void;
}

export function TicketQRCode({
  ticketData,
  size = 200,
  className = "",
  onQRGenerated,
}: TicketQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [ticketData]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const qrContent = `🎫 EVENT TICKET 🎫
📱 Ticket ID: ${ticketData.ticketId}
🎭 Event: ${ticketData.eventTitle}
📅 Date: ${ticketData.eventDate}
⏰ Time: ${ticketData.eventTime}
📍 Location: ${ticketData.location}
💰 Price: ${ticketData.price}
👤 Owner: ${ticketData.ownerAddress.slice(
        0,
        8
      )}...${ticketData.ownerAddress.slice(-6)}
✅ Status: ${ticketData.used ? "USED" : "VALID"}

🔗 For event staff verification:
Event ID: ${ticketData.eventId}
Purchase Time: ${new Date(ticketData.timestamp * 1000).toLocaleString()}
Network: Stacks Testnet
Version: 1.0

⚠️ This ticket is valid for entry to the above event only.
Present this QR code at the event entrance for check-in.`;

      // Generate QR code with high error correction for scanning reliability
      const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H", // High error correction for reliable scanning
      });

      setQrCodeUrl(qrCodeDataUrl);

      // Call callback to pass QR data URL to parent component
      if (onQRGenerated) {
        onQRGenerated(qrCodeDataUrl);
      }
    } catch (err) {
      console.error("QR Code generation failed:", err);
      setError("Failed to generate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-red-600 text-sm text-center px-2">
          Error generating QR
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white p-2 rounded-lg border ${className}`}>
      <img
        src={qrCodeUrl}
        alt="Ticket QR Code"
        className="w-full h-full"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

// Utility function to extract ticket data from QR code (for scanners)
export function parseTicketQR(qrContent: string): TicketQRData | null {
  try {
    // First try to parse as JSON (legacy format)
    if (qrContent.trim().startsWith("{")) {
      const parsed = JSON.parse(qrContent);

      // Validate required fields
      if (!parsed.tkt || !parsed.evt || !parsed.own) {
        throw new Error("Missing required ticket fields");
      }

      return {
        ticketId: parsed.tkt,
        eventId: parsed.evt,
        eventTitle: parsed.name || "Unknown Event",
        ownerAddress: parsed.own,
        eventDate: parsed.date || "",
        eventTime: parsed.time || "",
        location: parsed.loc || "",
        price: parsed.val || "0",
        used: parsed.used || false,
        timestamp: parsed.ts || 0,
      };
    }

    // Parse the new user-friendly format
    if (qrContent.includes("EVENT TICKET")) {
      const lines = qrContent.split("\n");
      const ticketData: Partial<TicketQRData> = {};

      for (const line of lines) {
        if (line.includes("Ticket ID:")) {
          ticketData.ticketId = line.split("Ticket ID:")[1].trim();
        } else if (line.includes("Event:") && line.includes("🎭")) {
          ticketData.eventTitle = line.split("Event:")[1].trim();
        } else if (line.includes("Date:")) {
          ticketData.eventDate = line.split("Date:")[1].trim();
        } else if (line.includes("Time:")) {
          ticketData.eventTime = line.split("Time:")[1].trim();
        } else if (line.includes("Location:")) {
          ticketData.location = line.split("Location:")[1].trim();
        } else if (line.includes("Price:")) {
          ticketData.price = line.split("Price:")[1].trim();
        } else if (line.includes("Owner:")) {
          // Extract the truncated address - we'll need to reconstruct this properly in a real system
          const ownerPart = line.split("Owner:")[1].trim();
          ticketData.ownerAddress = ownerPart; // Store as-is for display
        } else if (line.includes("Status:")) {
          const status = line.split("Status:")[1].trim();
          ticketData.used = status === "USED";
        } else if (line.includes("Event ID:")) {
          ticketData.eventId = line.split("Event ID:")[1].trim();
        } else if (line.includes("Purchase Time:")) {
          const timeStr = line.split("Purchase Time:")[1].trim();
          ticketData.timestamp = Math.floor(new Date(timeStr).getTime() / 1000);
        }
      }

      // Validate required fields
      if (!ticketData.ticketId || !ticketData.eventId) {
        throw new Error(
          "Missing required ticket fields in user-friendly format"
        );
      }

      return {
        ticketId: ticketData.ticketId,
        eventId: ticketData.eventId,
        eventTitle: ticketData.eventTitle || "Unknown Event",
        ownerAddress: ticketData.ownerAddress || "",
        eventDate: ticketData.eventDate || "",
        eventTime: ticketData.eventTime || "",
        location: ticketData.location || "",
        price: ticketData.price || "0",
        used: ticketData.used || false,
        timestamp: ticketData.timestamp || 0,
      };
    }

    throw new Error("Unrecognized QR code format");
  } catch (error) {
    console.error("Failed to parse QR code:", error);
    return null;
  }
}

export type { TicketQRData };
