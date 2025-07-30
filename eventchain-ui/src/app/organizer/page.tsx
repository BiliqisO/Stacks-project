"use client";

import { useState } from "react";
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
  userSession,
} from "@/lib/stacks-utils";
import { useStacks } from "@/hooks/useStacks";

const mockOrganizerEvents = [
  {
    id: 1,
    title: "Web3 Developer Conference 2024",
    date: "2024-03-15",
    status: "active",
    ticketsSold: 245,
    totalTickets: 500,
    revenue: "122.5 STX",
  },
  {
    id: 2,
    title: "Blockchain Workshop",
    date: "2024-03-10",
    status: "completed",
    ticketsSold: 50,
    totalTickets: 50,
    revenue: "25 STX",
  },
  {
    id: 3,
    title: "NFT Meetup",
    date: "2024-03-25",
    status: "draft",
    ticketsSold: 0,
    totalTickets: 100,
    revenue: "0 STX",
  },
];

export default function OrganizerPage() {
  const [events, setEvents] = useState(mockOrganizerEvents);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { isSignedIn } = useStacks();
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    price: "",
    category: "",
    maxTickets: "",
  });

  const handleCreateEvent = async () => {
    if (!isSignedIn) {
      alert("Please connect your Stacks wallet first");
      return;
    }

    setIsCreating(true);
    try {
      const userData = userSession.loadUserData();
      console.log("=== USER SESSION DEBUG ===");
      console.log("User data:", userData);
      console.log("Profile:", userData?.profile);
      console.log("STX Address object:", userData?.profile?.stxAddress);

      const userAddress =
        userData?.profile?.stxAddress?.testnet ||
        userData?.profile?.stxAddress?.mainnet;
      console.log(
        "User address (testnet):",
        userData?.profile?.stxAddress?.testnet
      );
      console.log(
        "User address (mainnet):",
        userData?.profile?.stxAddress?.mainnet
      );
      console.log("Final user address:", userAddress);

      if (!userAddress) {
        alert(
          "Could not get your wallet address. Please reconnect your wallet."
        );
        setIsCreating(false);
        return;
      }

      console.log("Checking organizer status for:", userAddress);

      const isOrganizer = await readOrganizerStatus(userAddress);
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
        await addOrganizer(userAddress);

        alert(
          "Organizer registration submitted! Please wait for the transaction to confirm, then try creating the event again."
        );
        setIsCreating(false);
        return;
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

      // Add to local state for UI update
      const event = {
        id: events.length + 1,
        title: newEvent.title,
        date: newEvent.date,
        status: "pending", // Set as pending until transaction is confirmed
        ticketsSold: 0,
        totalTickets: Number.parseInt(newEvent.maxTickets) || 0,
        revenue: "0 STX",
      };
      setEvents([...events, event]);

      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        price: "",
        category: "",
        maxTickets: "",
      });
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
      const userData = userSession.loadUserData();
      console.log("=== CHECK ORGANIZER STATUS DEBUG ===");
      console.log("User data:", userData);

      const userAddress =
        userData?.profile?.stxAddress?.testnet ||
        userData?.profile?.stxAddress?.mainnet;
      console.log(
        "User address (testnet):",
        userData?.profile?.stxAddress?.testnet
      );
      console.log(
        "User address (mainnet):",
        userData?.profile?.stxAddress?.mainnet
      );
      console.log("Final user address:", userAddress);

      if (!userAddress) {
        alert(
          "Could not get your wallet address. Please reconnect your wallet."
        );
        return;
      }

      // Additional validation to make sure we don't use the contract address
      if (userAddress === "ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9") {
        console.error("ERROR: User address is same as contract address!");
        alert(
          "Error: Invalid user address detected. Please disconnect and reconnect your wallet."
        );
        return;
      }

      console.log("Checking organizer status for:", userAddress);
      const isOrganizer = await readOrganizerStatus(userAddress);

      if (isOrganizer) {
        alert("You are registered as an organizer! You can create events.");
      } else {
        const shouldRegister = confirm(
          "You are not registered as an organizer yet. Would you like to register now?"
        );
        if (shouldRegister) {
          await addOrganizer(userAddress);
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
                    <div className="space-y-2 md:col-span-2">
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
                  <div className="text-2xl font-bold">147.5 STX</div>
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
                  <div className="text-2xl font-bold">295</div>
                </CardContent>
              </Card>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {events.map((event) => (
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
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
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
                            (event.ticketsSold / event.totalTickets) * 100
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
