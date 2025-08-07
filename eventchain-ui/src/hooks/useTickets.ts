"use client";

import { useState, useEffect } from "react";
import { readUserTickets, readUserTransferHistory } from "@/lib/stacks-utils";
import { useStacks } from "./useStacks";

interface Ticket {
  id: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  ticketType: string;
  price: string;
  priceDisplay: string;
  status: "active" | "used" | "expired";
  qrCode: string;
  tokenId: string;
  result?: any;
  isCheckedIn?: boolean;
}

interface TransferHistory {
  id: number;
  eventTitle: string;
  action: string;
  from: string;
  to: string;
  date: string;
  txHash: string;
}

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, isSignedIn } = useStacks();

  const transformBlockchainTicket = (blockchainTicket: any): Ticket => {
    const eventData = blockchainTicket.result || blockchainTicket;
    console.log("Transforming blockchain ticket:", eventData);
    
    // Parse Clarity tuple data
    let parsedData: any = {};
    if (eventData && typeof eventData === 'object') {
      // Handle tuple response from Clarity
      if (eventData.type === 'tuple' && eventData.data) {
        parsedData = eventData.data;
      } else if (eventData.type === 'some' && eventData.value) {
        // Handle optional response
        const innerValue = eventData.value;
        if (innerValue.type === 'tuple' && innerValue.value) {
          const tupleData = innerValue.value;
          parsedData = {
            creator: tupleData.creator?.value || "",
            name: tupleData.name?.value || "",
            location: tupleData.location?.value || "",
            timestamp: tupleData.timestamp?.value ? Number(tupleData.timestamp.value) : 0,
            price: tupleData.price?.value ? Number(tupleData.price.value) : 0,
            "total-tickets": tupleData["total-tickets"]?.value ? Number(tupleData["total-tickets"].value) : 0,
            "tickets-sold": tupleData["tickets-sold"]?.value ? Number(tupleData["tickets-sold"].value) : 0,
          };
        }
      } else {
        parsedData = eventData;
      }
      
      // Extract values from Clarity types if needed
      if (parsedData && typeof parsedData === 'object') {
        Object.keys(parsedData).forEach(key => {
          const value = parsedData[key];
          if (value && typeof value === 'object') {
            if (value.type === 'uint') {
              parsedData[key] = parseInt(value.value.toString());
            } else if (value.type === 'string-utf8') {
              parsedData[key] = value.value;
            } else if (value.type === 'principal') {
              parsedData[key] = value.value;
            } else if (value.value !== undefined) {
              parsedData[key] = value.value;
            }
          }
        });
      }
    }
    
    console.log("Parsed ticket data:", parsedData);
    
    // Transform to match UI format
    const eventTitle = parsedData.name || parsedData.title || "Untitled Event";
    const location = parsedData.location || "TBD";
    const timestamp = parsedData.timestamp || Math.floor(Date.now() / 1000);
    const price = parsedData.price || 0;
    const priceInSTX = price / 1000000; // Convert from microSTX to STX
    
    // Create date and time from timestamp
    const eventDate = new Date(timestamp * 1000);
    const date = eventDate.toISOString().split('T')[0];
    const time = eventDate.toTimeString().split(' ')[0].substring(0, 5);
    
    // Determine ticket status
    const status = blockchainTicket.isCheckedIn ? "used" : "active";
    
    return {
      id: blockchainTicket.id || 0,
      eventTitle,
      eventDate: date,
      eventTime: time,
      location,
      ticketType: "General Admission", // Default - could be enhanced from contract
      price: price.toString(),
      priceDisplay: `${priceInSTX.toFixed(2)} STX`,
      status,
      qrCode: `QR-${blockchainTicket.id || 0}-${address}`,
      tokenId: `NFT#${blockchainTicket.id?.toString().padStart(6, '0') || '000000'}`,
      result: blockchainTicket.result,
      isCheckedIn: blockchainTicket.isCheckedIn || false,
    };
  };

  const fetchUserTickets = async () => {
    if (!address || !isSignedIn) {
      setTickets([]);
      setTransferHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching tickets for user:", address);
      
      // Fetch user tickets and transfer history in parallel
      const [userTickets, userHistory] = await Promise.all([
        readUserTickets(address),
        readUserTransferHistory(address)
      ]);
      
      console.log("Raw user tickets:", userTickets);
      console.log("Raw transfer history:", userHistory);
      
      // Transform blockchain tickets to match UI format
      const transformedTickets = userTickets.map(transformBlockchainTicket);
      console.log("Transformed tickets:", transformedTickets);
      
      setTickets(transformedTickets);
      setTransferHistory(userHistory);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch tickets");
      setTickets([]);
      setTransferHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTickets();
  }, [address, isSignedIn]);

  return {
    tickets,
    transferHistory,
    isLoading,
    error,
    refetch: fetchUserTickets,
  };
};