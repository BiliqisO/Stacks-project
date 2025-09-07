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
  
  // Test function to debug image data (BigInt-safe)
  const debugImageData = (blockchainEvent: any) => {
    console.log("🐛 === IMAGE DEBUG START ===");
    console.log("🐛 Event data structure:", blockchainEvent?.result);
    console.log("🐛 Event data type:", typeof blockchainEvent?.result);
    
    if (blockchainEvent?.result?.type === 'some') {
      console.log("🐛 Found 'some' type, checking value:", blockchainEvent.result.value);
      if (blockchainEvent.result.value?.type === 'tuple') {
        console.log("🐛 Found tuple in some, checking tuple value:", blockchainEvent.result.value.value);
        const tupleData = blockchainEvent.result.value.value;
        console.log("🐛 Tuple fields:", Object.keys(tupleData || {}));
        console.log("🐛 Image field in tuple:", tupleData?.image);
        console.log("🐛 Image field type:", typeof tupleData?.image);
        console.log("🐛 Image field value:", tupleData?.image?.value);
      }
    }
    console.log("🐛 === IMAGE DEBUG END ===");
  };

  const transformBlockchainEvent = (blockchainEvent: any): Event => {
    // Debug the image data first
    debugImageData(blockchainEvent);
    
    // Handle Clarity data structure from the blockchain
    const eventData = blockchainEvent.result || blockchainEvent;
    console.log("Transforming blockchain event:", eventData);
    
    // Parse Clarity tuple data with comprehensive handling
    let parsedData: any = {};
    if (eventData && typeof eventData === 'object') {
      // Handle tuple response from Clarity
      if (eventData.type === 'tuple' && eventData.data) {
        parsedData = eventData.data;
      } else if (eventData.type === 'some' && eventData.value) {
        // Handle optional response - this is the most common format from get-event
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
            image: tupleData.image?.value || "", // Extract image from blockchain
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
      
      // Additional parsing for nested tuple structures from Clarity
      if (eventData && eventData.value && typeof eventData.value === 'object') {
        const tupleData = eventData.value;
        if (tupleData.image && tupleData.image.value) {
          parsedData.image = tupleData.image.value;
        }
      }
      
      // Handle direct tuple parsing (when eventData is the tuple itself)
      if (eventData && eventData.image && typeof eventData.image === 'object' && eventData.image.value) {
        parsedData.image = eventData.image.value;
      }
      
      // Handle case where image is directly accessible
      if (eventData && typeof eventData.image === 'string') {
        parsedData.image = eventData.image;
      }
    }
    
    console.log("Parsed event data:", parsedData);
    
    // Transform to match UI format
    const title = parsedData.name || parsedData.title || "Untitled Event";
    const location = parsedData.location || "TBD";
    // Extract image hash from blockchain data only
    const blockchainImageHash = (parsedData.image || "").toString().trim();
    
    console.log("🖼️ Image debugging for event:", title);
    console.log("🔍 Raw eventData:", eventData);
    console.log("🔍 Raw parsedData fields:", Object.keys(parsedData));
    console.log("🔍 Image field candidates:", {
      'parsedData.image': parsedData.image,
      'parsedData["image-hash"]': parsedData["image-hash"],
      'parsedData.imageHash': parsedData.imageHash,
      'eventData.image': eventData?.image,
      'final blockchainImageHash': blockchainImageHash
    });
    
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
    
    // Use stored image if available - prioritize blockchain image hash
    let storedImage = "/placeholder.svg?height=200&width=300";
    
    // Image hash should come from blockchain only for cross-device compatibility
    const imageHash = blockchainImageHash;
    console.log("🔍 Blockchain image hash for event:", title, "->", blockchainImageHash || "NONE");
    
    if (imageHash && imageHash !== "") {
      // Use the most reliable IPFS gateway first
      const ipfsGateways = [
        'https://gateway.pinata.cloud/ipfs',
        'https://cloudflare-ipfs.com/ipfs',
        'https://ipfs.io/ipfs'
      ];
      
      storedImage = `${ipfsGateways[0]}/${imageHash}`;
      console.log("✅ Using IPFS image:", storedImage, "from blockchain");
    } else {
      console.log("❌ No blockchain image hash found, using placeholder for event:", title);
    }
    
    return {
    id: blockchainEvent.id ? blockchainEvent.id.toString() : "0",
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