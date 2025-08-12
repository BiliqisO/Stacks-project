"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  Settings,
  Trash2,
  Edit,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  createEvent,
  readOrganizerStatus,
  addOrganizer,
  readOrganizerEvents,
} from "@/lib/stacks-utils";
import { useStacks } from "@/hooks/useStacks";

interface Event {
  id: number;
  title: string;
  name?: string;
  location?: string;
  creator?: string;
  timestamp?: number;
  price?: number;
  totalTickets?: number;
  ticketsSold?: number;
  date?: string;
  status?: string;
  revenue?: string;
}

export default function OrganizerPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { isSignedIn, address } = useStacks();
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    price: "",
    category: "",
    maxTickets: "",
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Function to fetch events from blockchain
  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      console.log("Fetching events from blockchain for organizer:", address);
      
      if (!address) {
        console.log("No address available, skipping event fetch");
        setEvents([]);
        return;
      }
      
      const blockchainEvents = await readOrganizerEvents(address);
      console.log("Raw blockchain events for organizer:", blockchainEvents);
      
      // Transform blockchain events to match our UI format
      const transformedEvents: Event[] = blockchainEvents.map((event: any, index: number) => {
        // Handle Clarity data structure from the blockchain
        const eventData = event.result || event;
        console.log("Transforming event data:", eventData);
        
        // Parse Clarity tuple data
        let parsedData: any = {};
        if (eventData && typeof eventData === 'object') {
          // Handle tuple response from Clarity
          if (eventData.type === 'tuple' && eventData.data) {
            parsedData = eventData.data;
          } else {
            parsedData = eventData;
          }
          
          // Extract values from Clarity types
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
        
        console.log("Parsed event data:", parsedData);
        
        return {
          id: event.id || index + 1,
          title: parsedData.name || parsedData.title || "Untitled Event",
          name: parsedData.name,
          location: parsedData.location || "TBD",
          creator: parsedData.creator,
          timestamp: parsedData.timestamp,
          price: parsedData.price,
          totalTickets: parsedData["total-tickets"] || parsedData.totalTickets || 0,
          ticketsSold: parsedData["tickets-sold"] || parsedData.ticketsSold || 0,
          date: parsedData.timestamp ? new Date(parsedData.timestamp * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: determineEventStatus(parsedData),
          revenue: calculateRevenue(parsedData),
        };
      });
      
      console.log("Transformed events:", transformedEvents);
      setEvents(transformedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]); // Set empty array on error
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Helper function to determine event status
  const determineEventStatus = (eventData: any) => {
    if (!eventData.timestamp) return "draft";
    
    const eventTime = eventData.timestamp * 1000;
    const now = Date.now();
    
    if (eventTime > now) {
      return "active"; // Future event
    } else {
      return "completed"; // Past event
    }
  };

  // Helper function to calculate revenue
  const calculateRevenue = (eventData: any) => {
    const ticketsSold = eventData["tickets-sold"] || eventData.ticketsSold || 0;
    const price = eventData.price || 0;
    const revenue = (ticketsSold * price) / 1000000; // Convert from microSTX to STX
    return `${revenue.toFixed(2)} STX`;
  };

  // Load events on component mount and when address changes
  useEffect(() => {
    if (isSignedIn && address) {
      fetchEvents();
    }
  }, [isSignedIn, address]);

  const handleCreateEvent = async () => {
    if (!isSignedIn) {
      alert("Please connect your Stacks wallet first");
      return;
    }

    setIsCreating(true);
    try {
      console.log("=== USER ADDRESS DEBUG ===");
      console.log("Address from useStacks:", address);
      if (!address) {
        alert(
          "Could not get your wallet address. Please reconnect your wallet."
        );
        setIsCreating(false);
        return;
      }

      console.log("Checking organizer status for:", address);

      const isOrganizer = await readOrganizerStatus(address);
      console.log("Is organizer:", isOrganizer);

      if (!isOrganizer) {
        const shouldBecomeOrganizer = confirm(
          "You need to be registered as an organizer to create events. Would you like to register now? This will require a transaction."
        );

        if (!shouldBecomeOrganizer) {
          setIsCreating(false);
          return;
        }

        console.log("Adding user as organizer...");
        await addOrganizer(address);

        console.log("Waiting for transaction to confirm...");
        // Wait a bit for the transaction to potentially confirm
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check again if user is now an organizer
        console.log("Re-checking organizer status after registration...");
        const isOrganizerAfterRegistration = await readOrganizerStatus(address);
        
        if (isOrganizerAfterRegistration) {
          console.log("✅ Organizer status confirmed! Continuing with event creation...");
          // Continue with event creation - don't return here
        } else {
          console.log("⚠️ Organizer status not yet confirmed, but transaction was submitted");
          alert(
            "Organizer registration submitted! The transaction may still be confirming. Please wait a moment and try creating the event again."
          );
          setIsCreating(false);
          return;
        }
      }

      const timestamp = Math.floor(
        new Date(`${newEvent.date}T${newEvent.time}`).getTime() / 1000
      );

      const priceInMicroSTX = Math.floor(
        Number.parseFloat(newEvent.price) * 1000000
      );

      console.log("Creating event with parameters:", {
        name: newEvent.title,
        location: newEvent.location,
        timestamp,
        priceInMicroSTX,
        totalTickets: Number.parseInt(newEvent.maxTickets),
      });

      // Call the smart contract function
      await createEvent(
        newEvent.title,
        newEvent.location,
        timestamp,
        priceInMicroSTX,
        Number.parseInt(newEvent.maxTickets)
      );

      // Store event description and other metadata locally
      // We need to determine the event ID that will be created
      // For now, we'll store based on a combination of title, location, and timestamp
      const eventKey = `${newEvent.title}-${newEvent.location}-${timestamp}`;
      const eventMetadata = {
        description: newEvent.description,
        category: newEvent.category,
        image: imagePreview,
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`event-metadata-${eventKey}`, JSON.stringify(eventMetadata));
      }

      // Refresh events from blockchain after successful creation
      setTimeout(() => {
        fetchEvents(); // Refresh the events list from blockchain
      }, 2000); // Wait 2 seconds for potential blockchain confirmation

      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        price: "",
        category: "",
        maxTickets: "",
        image: null,
      });
      setImagePreview(null);
      setIsCreateDialogOpen(false);
      alert(
        "Event creation transaction submitted! Please check your wallet and wait for confirmation."
      );
    } catch (error) {
      console.error("Event creation failed:", error);
      alert(
        `Event creation failed: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckOrganizerStatus = async () => {
    if (!isSignedIn) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log("=== CHECK ORGANIZER STATUS DEBUG ===");
      console.log("Address from useStacks:", address);

      if (!address) {
        alert(
          "Could not get your wallet address. Please reconnect your wallet."
        );
        return;
      }


      console.log("Checking organizer status for:", address);
      const isOrganizer = await readOrganizerStatus(address);

      if (isOrganizer) {
        alert("You are registered as an organizer! You can create events.");
      } else {
        const shouldRegister = confirm(
          "You are not registered as an organizer yet. Would you like to register now?"
        );
        if (shouldRegister) {
          await addOrganizer(address);
          alert(
            "Organizer registration submitted! Please wait for confirmation."
          );
        }
      }
    } catch (error) {
      console.error("Error checking organizer status:", error);
      alert("Error checking organizer status. Please try again.");
    }
  };

  const handleDeleteEvent = (id: number) => {
    setEvents(events.filter((event) => event.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "draft":
        return "bg-yellow-500";
      case "pending":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Event Organizer Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Create and manage events on Stacks testnet
              </p>
            </div>
            <div className="flex gap-2">
              {isSignedIn && (
                <Button
                  variant="outline"
                  onClick={handleCheckOrganizerStatus}
                >
                  Check Organizer Status
                </Button>
              )}
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button disabled={!isSignedIn}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isSignedIn ? "Create Event" : "Connect Wallet"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new event on the Stacks
                      blockchain
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                        placeholder="Enter event title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newEvent.category}
                        onValueChange={(value) =>
                          setNewEvent({ ...newEvent, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your event"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, time: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, location: e.target.value })
                        }
                        placeholder="Event location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Ticket Price (STX)</Label>
                      <Input
                        id="price"
                        value={newEvent.price}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, price: e.target.value })
                        }
                        placeholder="0.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTickets">Maximum Tickets</Label>
                      <Input
                        id="maxTickets"
                        type="number"
                        value={newEvent.maxTickets}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            maxTickets: e.target.value,
                          })
                        }
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Event Image</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setNewEvent({ ...newEvent, image: file });
                          
                          // Create preview URL
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setImagePreview(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setImagePreview(null);
                          }
                        }}
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="Event preview"
                            className="h-24 w-24 object-cover rounded-md border"
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Note: Images are stored locally and not on the blockchain
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateEvent}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!isSignedIn && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Please connect your Stacks wallet to create and manage events.
            </p>
          </div>
        )}

        <Tabs
          defaultValue="events"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent
            value="events"
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Events
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Events
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.filter((e) => e.status === "active").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.reduce((total, event) => {
                      const ticketsSold = event.ticketsSold || 0;
                      const price = event.price || 0;
                      const revenue = (ticketsSold * price) / 1000000; // Convert from microSTX to STX
                      return total + revenue;
                    }, 0).toFixed(2)} STX
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tickets Sold
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.reduce((total, event) => total + (event.ticketsSold || 0), 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {isLoadingEvents ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading events from blockchain...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No events found. Create your first event!</p>
                </div>
              ) : (
                events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <CardTitle className="text-lg">
                            {event.title}
                          </CardTitle>
                          <CardDescription>{event.date}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(event.status || "active")}>
                          {event.status || "active"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Tickets Sold
                        </p>
                        <p className="text-lg font-semibold">
                          {event.ticketsSold}/{event.totalTickets}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-lg font-semibold">{event.revenue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Sales Rate
                        </p>
                        <p className="text-lg font-semibold">
                          {Math.round(
                            ((event.ticketsSold || 0) / (event.totalTickets || 1)) * 100
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="analytics"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Revenue chart would go here
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Sales chart would go here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
