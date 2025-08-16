"use client";

import { useState, useEffect } from "react";
import {
  QrCode,
  Search,
  CheckCircle,
  Users,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStacks } from "@/hooks/useStacks";
import {
  readEvents,
  readUserTickets,
  checkInTicket,
  checkInByTicketId,
  getTicketInfo,
  isTicketValid,
  readUserTickets as getUserTickets,
  testContractConnection,
} from "@/lib/stacks-utils";

interface AttendeeTicket {
  id: number;
  eventId: number;
  eventName: string;
  ticketOwner: string;
  ticketId: string;
  checkInTime: string | null;
  status: "pending" | "checked-in";
  isCheckedIn: boolean;
}

export default function CheckInPage() {
  const [attendees, setAttendees] = useState<AttendeeTicket[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [isValidatingTicket, setIsValidatingTicket] = useState(false);
  const { address, isSignedIn } = useStacks();

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allEvents = await readEvents();
      console.log("Fetched events for check-in:", allEvents);
      setEvents(allEvents);

      // Auto-select first event if available
      if (allEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(allEvents[0].id);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedEventData = () => {
    if (!selectedEvent) return null;
    const event = events.find((e) => e.id === selectedEvent);
    if (!event || !event.result) return null;

    const eventData = event.result;
    let parsedEventData: any = {};

    // Parse event data based on its structure
    if (eventData && typeof eventData === "object") {
      if (eventData.type === "some" && eventData.value) {
        const innerValue = eventData.value;
        if (innerValue.type === "tuple" && innerValue.value) {
          const tupleData = innerValue.value;
          parsedEventData = {
            name: tupleData.name?.value || `Event ${selectedEvent}`,
            creator: tupleData.creator?.value || "",
            location: tupleData.location?.value || "TBD",
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
      } else {
        parsedEventData = eventData;
      }
    }

    return parsedEventData;
  };

  const handleCheckInForEvent = async () => {
    if (!selectedEvent || !address || !isSignedIn) {
      setError("Please connect your wallet and select an event");
      return;
    }

    const eventData = getSelectedEventData();
    if (!eventData) {
      setError("Event data not available");
      return;
    }

    try {
      setIsCheckingIn(true);
      setError(null);

      console.log("=== Pre-Check-in Validation ===");
      console.log("Event ID:", selectedEvent);
      console.log("User Address:", address);
      console.log("Event Creator:", eventData.creator);
      console.log("Is Creator:", eventData.creator === address);

      // CRITICAL: The smart contract requires EITHER:
      // 1. User is the event creator (can check in anyone)
      // 2. User has a ticket AND creator is checking them in

      const isCreator = eventData.creator === address;
      console.log("Is caller the event creator?", isCreator);

      if (isCreator) {
        console.log("✅ User is event creator - they can check in attendees");
        console.log("✅ Event creators don't need tickets to manage check-ins");
      } else {
        console.log("❌ User is not the event creator");

        // Check if user has a ticket (they'd need creator to check them in anyway)
        const userTickets = await getUserTickets(address);
        const hasTicketForEvent = userTickets.some(
          (ticket) => ticket.id === selectedEvent
        );

        if (!hasTicketForEvent) {
          setError(
            `You don't own a ticket for "${eventData.name}". Please purchase a ticket first.`
          );
        } else {
          setError(
            `You have a ticket but only the event creator can perform check-ins. Contact the creator of "${eventData.name}" to check you in.`
          );
        }
        return;
      }

      console.log("🚀 Calling blockchain check-in function...");

      // Call the blockchain check-in function
      await checkInTicket(selectedEvent, address);

      alert(`Successfully checked in for "${eventData.name}"!`);

      // Refresh events data to update any stats
      await fetchEvents();
    } catch (err) {
      console.error("Error checking in:", err);

      // Parse error codes from the smart contract
      let errorMessage = "Failed to check in";
      if (err instanceof Error) {
        const errorStr = err.message.toLowerCase();
        if (errorStr.includes("u301")) {
          errorMessage = "Ticket has already been used for check-in";
        } else if (errorStr.includes("u302")) {
          errorMessage =
            "No ticket found for this event and user. Even event creators need to own a ticket to check in.";
        } else if (errorStr.includes("u303")) {
          errorMessage = "Only the event creator can perform check-ins";
        } else if (errorStr.includes("u304")) {
          errorMessage = "Event not found";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleTicketIdValidation = async (ticketId: string) => {
    if (!ticketId.trim() || isNaN(Number(ticketId))) {
      setTicketInfo(null);
      return;
    }

    try {
      setIsValidatingTicket(true);
      setError(null);

      console.log("Validating ticket ID:", ticketId);

      // Get ticket info
      const info = await getTicketInfo(Number(ticketId));
      console.log("Ticket info response:", info);

      if (info && info !== "(none)") {
        // Parse the ticket info (will need to handle Clarity types)
        setTicketInfo({
          ticketId: Number(ticketId),
          found: true,
          info: info,
        });
      } else {
        setTicketInfo({
          ticketId: Number(ticketId),
          found: false,
          error: "Ticket ID not found",
        });
      }
    } catch (err) {
      console.error("Error validating ticket:", err);
      setTicketInfo({
        ticketId: Number(ticketId),
        found: false,
        error: "Error validating ticket",
      });
    } finally {
      setIsValidatingTicket(false);
    }
  };

  const handleTicketIdCheckIn = async () => {
    if (!ticketIdInput.trim() || isNaN(Number(ticketIdInput))) {
      setError("Please enter a valid ticket ID");
      return;
    }

    if (!address || !isSignedIn) {
      setError("Please connect your wallet (organizer account)");
      return;
    }

    try {
      setIsCheckingIn(true);
      setError(null);

      console.log("Checking in ticket ID:", ticketIdInput);

      await checkInByTicketId(Number(ticketIdInput));

      alert(`Successfully checked in ticket #${ticketIdInput}!`);

      // Clear the input and refresh
      setTicketIdInput("");
      setTicketInfo(null);
      await fetchEvents();
    } catch (err) {
      console.error("Error checking in ticket:", err);

      // Parse error codes
      let errorMessage = "Failed to check in ticket";
      if (err instanceof Error) {
        const errorStr = err.message.toLowerCase();
        if (errorStr.includes("u301")) {
          errorMessage = "Ticket has already been used for check-in";
        } else if (errorStr.includes("u303")) {
          errorMessage = "Only the event creator can perform check-ins";
        } else if (errorStr.includes("u304")) {
          errorMessage = "Event not found";
        } else if (errorStr.includes("u305")) {
          errorMessage = "Ticket ID not found";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleQRCheckIn = async () => {
    if (!qrInput.trim()) {
      setError("Please enter a ticket ID");
      return;
    }

    // Use the ticket ID method for QR codes too
    setTicketIdInput(qrInput);
    await handleTicketIdCheckIn();
    setQrInput("");
  };

  const selectedEventData = getSelectedEventData();
  const totalTickets = selectedEventData?.["total-tickets"] || 0;
  const ticketsSold = selectedEventData?.["tickets-sold"] || 0;

  // Check if user has a ticket for the selected event
  const userHasTicket = selectedEvent
    ? userTickets.some((ticket) => ticket.id === selectedEvent)
    : false;

  const fetchUserTickets = async () => {
    if (!address || !isSignedIn) {
      setUserTickets([]);
      return;
    }

    try {
      setIsLoadingTickets(true);
      const tickets = await getUserTickets(address);
      console.log("Fetched user tickets:", tickets);
      setUserTickets(tickets);
    } catch (err) {
      console.error("Error fetching user tickets:", err);
      setUserTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (address && isSignedIn) {
      fetchUserTickets();
    } else {
      setUserTickets([]);
    }
  }, [address, isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the check-in portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be connected to manage event check-ins
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {error && (
          <Alert
            className="mb-6"
            variant="destructive"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Event Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>
              Choose an event to manage check-ins
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && events.length === 0 ? (
              <p className="text-muted-foreground">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground">No events found</p>
            ) : (
              <select
                className="w-full p-2 border border-input bg-background rounded-md"
                value={selectedEvent || ""}
                onChange={(e) => setSelectedEvent(parseInt(e.target.value))}
              >
                <option value="">Select an event...</option>
                {events.map((event) => {
                  const eventData = event.result;
                  let eventName = `Event ${event.id}`;

                  if (eventData && typeof eventData === "object") {
                    if (eventData.type === "some" && eventData.value) {
                      const innerValue = eventData.value;
                      if (innerValue.type === "tuple" && innerValue.value) {
                        eventName = innerValue.value.name?.value || eventName;
                      }
                    } else if (eventData.name) {
                      eventName = eventData.name;
                    }
                  }

                  return (
                    <option
                      key={event.id}
                      value={event.id}
                    >
                      {eventName}
                    </option>
                  );
                })}
              </select>
            )}
          </CardContent>
        </Card>

        {/* Event Info & Check-in */}
        {selectedEventData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{selectedEventData.name}</CardTitle>
              <CardDescription>
                {selectedEventData.location} •{" "}
                {new Date(
                  selectedEventData.timestamp * 1000
                ).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalTickets}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Tickets
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{ticketsSold}</div>
                  <div className="text-sm text-muted-foreground">
                    Tickets Sold
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(selectedEventData.price / 1000000).toFixed(2)} STX
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ticket Price
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* Ticket ID Based Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Ticket ID Check-in
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-sm">
                      <strong>How it works:</strong> When attendees purchase
                      tickets, they receive a unique Ticket ID. At the event
                      entrance, they show their Ticket ID (or QR code), and you
                      enter it here to check them in.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter Ticket ID:</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={ticketIdInput}
                    onChange={(e) => {
                      setTicketIdInput(e.target.value);
                      // Auto-validate as user types
                      if (e.target.value) {
                        handleTicketIdValidation(e.target.value);
                      } else {
                        setTicketInfo(null);
                      }
                    }}
                    placeholder="e.g. 12345"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTicketIdCheckIn}
                    disabled={isCheckingIn || !ticketIdInput.trim() || !address}
                    className="min-w-[120px]"
                  >
                    {isCheckingIn ? "Checking In..." : "Check In"}
                  </Button>
                </div>
              </div>

              {/* Ticket Validation Display */}
              {isValidatingTicket && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Validating ticket...</span>
                  </div>
                </div>
              )}

              {ticketInfo && (
                <div
                  className={`p-3 rounded-lg ${
                    ticketInfo.found
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {ticketInfo.found ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">
                          Valid Ticket Found!
                        </span>
                      </div>
                      <div className="text-sm text-green-700 font-mono">
                        <p>
                          <strong>Ticket ID:</strong> {ticketInfo.ticketId}
                        </p>
                        <p>
                          <strong>Status:</strong> Ready for check-in
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-800">{ticketInfo.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/*  Check-in Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Check in by Address</CardTitle>
            <CardDescription>Alternative check-in methods</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="qr-scan"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr-scan">QR Scanner</TabsTrigger>
                <TabsTrigger value="manual">Address Entry</TabsTrigger>
              </TabsList>

              <TabsContent
                value="qr-scan"
                className="space-y-4"
              >
                <div className="bg-muted p-8 rounded-lg text-center">
                  <QrCode className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    QR Code Scanner integration
                  </p>
                  <Button
                    onClick={() => setIsScanning(!isScanning)}
                    className="mb-4"
                    variant="outline"
                  >
                    {isScanning ? "Stop Scanning" : "Start Scanning"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Or enter ticket ID from QR code:
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="Ticket ID from QR code"
                    />
                    <Button
                      onClick={handleQRCheckIn}
                      disabled={isCheckingIn || !qrInput.trim()}
                      variant="outline"
                    >
                      {isCheckingIn ? "Checking In..." : "Check In"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="manual"
                className="space-y-4"
              >
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Manual check-in using wallet addresses (less practical for
                    events)
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Enter attendee wallet address:
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                    />
                    <Button
                      onClick={() => {
                        if (searchTerm.trim() && selectedEvent) {
                          handleCheckInForEvent();
                        }
                      }}
                      disabled={
                        !selectedEvent || isCheckingIn || !searchTerm.trim()
                      }
                      variant="outline"
                    >
                      {isCheckingIn ? "Checking In..." : "Check In Address"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
}
