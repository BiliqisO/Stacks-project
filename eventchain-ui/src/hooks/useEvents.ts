"use client";

import { useState, useEffect } from "react";
import { readEvents } from "@/lib/stacks-utils";

interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  price: string;
  priceDisplay: string;
  category: string;
  attendees: number;
  image: string;
  organizer: string;
  creator?: string;
  timestamp?: number;
  totalTickets?: number;
  ticketsSold?: number;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformBlockchainEvent = (blockchainEvent: any): Event => {
    // Handle Clarity data structure from the blockchain
    const eventData = blockchainEvent.result || blockchainEvent;
    console.log("Transforming blockchain event:", eventData);
    
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
    
    console.log("Parsed event data:", parsedData);
    
    // Transform to match UI format
    const title = parsedData.name || parsedData.title || "Untitled Event";
    const location = parsedData.location || "TBD";
    const timestamp = parsedData.timestamp || Math.floor(Date.now() / 1000);
    const price = parsedData.price || 0;
    const priceInSTX = price / 1000000; // Convert from microSTX to STX
    const totalTickets = parsedData["total-tickets"] || parsedData.totalTickets || 0;
    const ticketsSold = parsedData["tickets-sold"] || parsedData.ticketsSold || 0;
    const creator = parsedData.creator || "Unknown";
    
    // Create date and time from timestamp
    const eventDate = new Date(timestamp * 1000);
    const date = eventDate.toISOString().split('T')[0];
    const time = eventDate.toTimeString().split(' ')[0].substring(0, 5);
    
    // Load stored metadata - try multiple key patterns to find the right one
    const eventKey1 = `event-metadata-${title}-${timestamp}`;
    const eventKey2 = `event-metadata-${title}-${location}-${timestamp}`;
    let eventMetadata: any = {};
    
    if (typeof window !== 'undefined') {
      // Try the primary key format first (matches create form)
      eventMetadata = JSON.parse(localStorage.getItem(eventKey1) || '{}');
      
      // If not found, try the secondary key format
      if (Object.keys(eventMetadata).length === 0) {
        eventMetadata = JSON.parse(localStorage.getItem(eventKey2) || '{}');
      }
    }
    
    const localStorageKey = `event-${blockchainEvent.id || 0}`;
    const localData: any = typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem(localStorageKey) || '{}') : {};

    // Use stored description if available, otherwise generate default
    const description = eventMetadata.description || localData.description || 
      `Join us for ${title}. This event is created on the Stacks blockchain with transparent and secure ticketing.`;
    
    // Determine category based on stored data or event name/title
    let category = eventMetadata.category || localData.category || "Technology"; // Default category
    if (!eventMetadata.category && !localData.category) {
      const titleLower = title.toLowerCase();
      if (titleLower.includes("art") || titleLower.includes("nft")) {
        category = "Art";
      } else if (titleLower.includes("defi") || titleLower.includes("finance")) {
        category = "Finance";
      } else if (titleLower.includes("music") || titleLower.includes("concert")) {
        category = "Music";
      }
    }
    
    // Use stored image if available - construct IPFS URL from hash
    let storedImage = "/placeholder.svg?height=200&width=300";
    
    const imageHash = eventMetadata.imageHash || localData.imageHash;
    console.log("Event metadata for image:", { eventMetadata, localData, imageHash, eventKey1, eventKey2 });
    
    if (imageHash && imageHash !== "") {
      // Construct IPFS gateway URL from the stored hash
      storedImage = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
      console.log("Using IPFS image:", storedImage);
    } else if (eventMetadata.image || localData.image) {
      // Fallback to direct image URL if available
      storedImage = eventMetadata.image || localData.image;
      console.log("Using fallback image:", storedImage);
    }
    
    return {
      id: blockchainEvent.id || 0,
      title,
      description,
      date,
      time,
      location,
      price: price.toString(),
      priceDisplay: `${priceInSTX.toFixed(2)} STX`,
      category,
      attendees: totalTickets,
      image: storedImage,
      organizer: creator.length > 20 ? `${creator.slice(0, 6)}...${creator.slice(-4)}` : creator,
      creator,
      timestamp,
      totalTickets,
      ticketsSold,
    };
  };

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching events from blockchain...");
      
      const blockchainEvents = await readEvents();
      console.log("Raw blockchain events:", blockchainEvents);
      
      // Transform blockchain events to match UI format
      const transformedEvents = blockchainEvents.map(transformBlockchainEvent);
      console.log("Transformed events:", transformedEvents);
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch events");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
};