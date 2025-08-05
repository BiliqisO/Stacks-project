"use client";

import { useState, useEffect } from "react";
import * as Tx from "@stacks/transactions";
import { STACKS_CONFIG } from "@/lib/stacks-config";

interface EventData {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: string;
  priceDisplay: string;
  category: string;
  attendees: number;
  maxAttendees: number;
  image: string;
  creator: string;
  organizer: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  timestamp?: number;
  totalTickets?: number;
  ticketsSold?: number;
  // Local storage for schedules and speakers (not on blockchain)
  schedules?: ScheduleItem[];
  speakers?: Speaker[];
}

interface ScheduleItem {
  time: string;
  title: string;
  speaker: string;
}

interface Speaker {
  name: string;
  role: string;
  avatar: string;
}

export const useEvent = (eventId: string | number) => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformBlockchainEvent = (
    blockchainEvent: any,
    id: number
  ): EventData => {
    console.log("Transforming blockchain event for details:", blockchainEvent);

    let parsedData: any = {};

    if (blockchainEvent && typeof blockchainEvent === "object") {
      // Handle optional response (some type)
      if (blockchainEvent.type === "some" && blockchainEvent.value) {
        const innerValue = blockchainEvent.value;
        if (innerValue.type === "tuple" && innerValue.value) {
          const tupleData = innerValue.value;
          parsedData = {
            creator: tupleData.creator?.value || "",
            name: tupleData.name?.value || "",
            location: tupleData.location?.value || "",
            timestamp: tupleData.timestamp?.value
              ? Number(tupleData.timestamp.value)
              : 0,
            price: tupleData.price?.value ? Number(tupleData.price.value) : 0,
            "total-tickets": tupleData["total-tickets"]?.value
              ? Number(tupleData["total-tickets"].value)
              : 0,
            "tickets-sold": tupleData["tickets-sold"]?.value
              ? Number(tupleData["tickets-sold"].value)
              : 0,
          };
        }
      } else if (blockchainEvent.type === "tuple" && blockchainEvent.data) {
        parsedData = blockchainEvent.data;
      } else {
        parsedData = blockchainEvent;
      }

      // Extract values from Clarity types if needed
      if (parsedData && typeof parsedData === "object") {
        Object.keys(parsedData).forEach((key) => {
          const value = parsedData[key];
          if (value && typeof value === "object") {
            if (value.type === "uint") {
              parsedData[key] = parseInt(value.value.toString());
            } else if (value.type === "string-utf8") {
              parsedData[key] = value.value;
            } else if (value.type === "principal") {
              parsedData[key] = value.value;
            } else if (value.value !== undefined) {
              parsedData[key] = value.value;
            }
          }
        });
      }
    }

    console.log("Parsed event data for details:", parsedData);

    // Transform to match UI format
    const title = parsedData.name || parsedData.title || "Untitled Event";
    const location = parsedData.location || "TBD";
    const timestamp = parsedData.timestamp || Math.floor(Date.now() / 1000);
    const price = parsedData.price || 0;
    const priceInSTX = price / 1000000; // Convert from microSTX to STX
    const totalTickets =
      parsedData["total-tickets"] || parsedData.totalTickets || 0;
    const ticketsSold =
      parsedData["tickets-sold"] || parsedData.ticketsSold || 0;
    const creator = parsedData.creator || "Unknown";

    const eventDate = new Date(timestamp * 1000);
    const date = eventDate.toISOString().split("T")[0];
    const time = eventDate.toTimeString().split(" ")[0].substring(0, 5);

    let category = "Technology"; // Default category
    const titleLower = title.toLowerCase();
    if (titleLower.includes("art") || titleLower.includes("nft")) {
      category = "Art";
    } else if (titleLower.includes("defi") || titleLower.includes("finance")) {
      category = "Finance";
    } else if (titleLower.includes("music") || titleLower.includes("concert")) {
      category = "Music";
    }

    // Load data from localStorage
    const localStorageKey = `event-${id}`;
    const localData =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem(localStorageKey) || "{}")
        : {};

    const eventKey = `${title}-${location}-${timestamp}`;
    const metadataKey = `event-metadata-${eventKey}`;
    const eventMetadata =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem(metadataKey) || "{}")
        : {};

    const description =
      eventMetadata.description ||
      localData.description ||
      `Join us for ${title}. This event is created on the Stacks blockchain with transparent and secure ticketing. Experience cutting-edge technology and network with industry professionals.`;

    const storedCategory = eventMetadata.category || localData.category;
    if (storedCategory) {
      category = storedCategory;
    }

    const storedImage =
      eventMetadata.image ||
      localData.image ||
      "/placeholder.svg?height=400&width=800";

    return {
      id,
      title,
      description,
      date,
      time: `${time} - ${new Date((timestamp + 8 * 3600) * 1000)
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5)}`, // Assume 8-hour duration
      location,
      price: price.toString(),
      priceDisplay: `${priceInSTX.toFixed(2)} STX`,
      category,
      attendees: ticketsSold,
      maxAttendees: totalTickets,
      image: storedImage,
      creator,
      organizer: {
        name:
          creator.length > 20
            ? `${creator.slice(0, 6)}...${creator.slice(-4)}`
            : creator,
        avatar: "/placeholder.svg?height=40&width=40",
        verified: true,
      },
      timestamp,
      totalTickets,
      ticketsSold,
      schedules: localData.schedules || [],
      speakers: localData.speakers || [],
    };
  };

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching event details for ID:", eventId);

      const eventIdNumber =
        typeof eventId === "string" ? parseInt(eventId) : eventId;

      if (isNaN(eventIdNumber) || eventIdNumber <= 0) {
        throw new Error("Invalid event ID");
      }

      const eventResult = await Tx.fetchCallReadOnlyFunction({
        contractAddress: STACKS_CONFIG.contractAddress,
        contractName: STACKS_CONFIG.contractName,
        functionName: "get-event",
        functionArgs: [Tx.uintCV(eventIdNumber)],
        network: STACKS_CONFIG.network,
        senderAddress: STACKS_CONFIG.contractAddress,
      });

      console.log("Raw blockchain event result:", eventResult);

      if (
        !eventResult ||
        String(eventResult) === "(none)" ||
        (eventResult as any).type === "none"
      ) {
        throw new Error("Event not found");
      }

      const transformedEvent = transformBlockchainEvent(
        eventResult,
        eventIdNumber
      );
      console.log("Transformed event:", transformedEvent);

      setEvent(transformedEvent);
    } catch (error) {
      console.error("Error fetching event:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch event"
      );
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Save schedules, speakers, and description to localStorage
  const updateEventData = (
    updates: Partial<Pick<EventData, "schedules" | "speakers" | "description">>
  ) => {
    if (!event) return;

    const localStorageKey = `event-${event.id}`;
    const existingData =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem(localStorageKey) || "{}")
        : {};

    const updatedData = { ...existingData, ...updates };

    if (typeof window !== "undefined") {
      localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
    }

    setEvent((prev) => (prev ? { ...prev, ...updates } : null));
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  return {
    event,
    isLoading,
    error,
    refetch: fetchEvent,
    updateEventData,
  };
};
