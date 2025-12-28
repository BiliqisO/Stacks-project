"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  Share2,
  Wallet,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buyTicket } from "@/lib/stacks-utils";
import { useStacks } from "@/hooks/useStacks";
import { useEvent } from "@/hooks/useEvent";
import IPFSImage from "@/components/IPFSImage";
import { toast } from "sonner";

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

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { isSignedIn, address } = useStacks();
  const { event, isLoading, error, refetch, updateEventData } = useEvent(params.id);

  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [newScheduleItem, setNewScheduleItem] = useState<ScheduleItem>({
    time: "",
    title: "",
    speaker: "",
  });

  const [isSpeakerDialogOpen, setIsSpeakerDialogOpen] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState<Speaker>({
    name: "",
    role: "",
    avatar: "",
  });

  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState("");

  const isOrganizer =
    event && address && event.creator.toLowerCase() === address.toLowerCase();

  const handlePurchase = async () => {
    if (!isSignedIn) {
      toast.error("Please connect your Stacks wallet first");
      return;
    }

    if (!event) {
      toast.error("Event data not loaded");
      return;
    }

    setIsPurchasing(true);
    try {
      for (let i = 0; i < ticketQuantity; i++) {
        await buyTicket(event.id, Number.parseInt(event.price), event.creator, (txId) => {
          toast.success("Ticket purchased successfully!", {
            description: `Transaction ID: ${txId.slice(0, 8)}...${txId.slice(-6)}`,
            duration: 5000,
          });
        });
      }
      toast.success(`${ticketQuantity} ticket(s) purchase initiated!`, {
        description: "Please check your wallet",
      });
      // Refetch event data to update ticket count
      refetch();
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error("Purchase failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleAddScheduleItem = () => {
    if (!event || !newScheduleItem.time || !newScheduleItem.title) return;

    const updatedSchedules = [...(event.schedules || []), newScheduleItem];
    updateEventData({ schedules: updatedSchedules });

    setNewScheduleItem({ time: "", title: "", speaker: "" });
    setIsScheduleDialogOpen(false);
  };

  const handleRemoveScheduleItem = (index: number) => {
    if (!event) return;

    const updatedSchedules =
      event.schedules?.filter((_, i) => i !== index) || [];
    updateEventData({ schedules: updatedSchedules });
  };

  const handleAddSpeaker = () => {
    if (!event || !newSpeaker.name || !newSpeaker.role) return;

    const speakerWithAvatar = {
      ...newSpeaker,
      avatar: newSpeaker.avatar || "/placeholder.svg?height=60&width=60",
    };

    const updatedSpeakers = [...(event.speakers || []), speakerWithAvatar];
    updateEventData({ speakers: updatedSpeakers });

    setNewSpeaker({ name: "", role: "", avatar: "" });
    setIsSpeakerDialogOpen(false);
  };

  const handleRemoveSpeaker = (index: number) => {
    if (!event) return;

    const updatedSpeakers = event.speakers?.filter((_, i) => i !== index) || [];
    updateEventData({ speakers: updatedSpeakers });
  };

  const handleEditDescription = () => {
    if (!event) return;
    setEditingDescription(event.description);
    setIsDescriptionDialogOpen(true);
  };

  const handleUpdateDescription = () => {
    if (!event || !editingDescription.trim()) return;

    const localStorageKey = `event-${event.id}`;
    const existingData =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem(localStorageKey) || "{}")
        : {};

    const updatedData = {
      ...existingData,
      description: editingDescription.trim(),
    };

    const eventKey = `${event.title}-${event.location}-${event.timestamp}`;
    const metadataKey = `event-metadata-${eventKey}`;
    const existingMetadata =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem(metadataKey) || "{}")
        : {};

    const updatedMetadata = {
      ...existingMetadata,
      description: editingDescription.trim(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
      localStorage.setItem(metadataKey, JSON.stringify(updatedMetadata));
    }

    updateEventData({ description: editingDescription.trim() } as any);

    setIsDescriptionDialogOpen(false);
    setEditingDescription("");
  };

  const handleShareEvent = async () => {
    if (!event) return;

    const eventUrl = `${window.location.origin}/event/${event.id}`;
    const shareText = `Check out this amazing event: ${event.title} - ${event.description.slice(0, 100)}...`;

    // Try to use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: eventUrl,
        });
      } catch (error) {
        // User cancelled sharing or sharing failed
        console.log("Web share cancelled or failed:", error);
        // Fall back to copying to clipboard
        fallbackShare(eventUrl, shareText);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      fallbackShare(eventUrl, shareText);
    }
  };

  const fallbackShare = async (url: string, text: string) => {
    try {
      // Try to copy URL to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("Event link copied to clipboard!");
    } catch (error) {
      // If clipboard API fails, show a dialog with the link
      const shareData = `${text}\n\nEvent Link: ${url}`;
      
      // Create a temporary text area to select the text for manual copying
      const textArea = document.createElement("textarea");
      textArea.value = shareData;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand("copy");
        toast.success("Event details copied to clipboard!");
      } catch (err) {
        // Final fallback - show the URL in a toast
        toast.info("Share this event", {
          description: url,
          duration: 10000,
        });
      }
      
      document.body.removeChild(textArea);
    }
  };

  const totalPrice = event
    ? (Number.parseInt(event.price) * ticketQuantity) / 1000000
    : 0;
  const gasFee = 0.001 * ticketQuantity;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Events</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">
            Loading event from blockchain...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Events</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-500 mb-4">{error || "Event not found"}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Events</span>
              </Link>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareEvent}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Event
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <IPFSImage
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
                fallback="/placeholder.svg"
                onLoad={() => console.log("Event detail image loaded successfully:", event.image)}
                onError={() => console.log("Event detail image failed to load:", event.image)}
              />
            </div>

            {/* Event Info */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary">{event.category}</Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">Blockchain Verified</span>
                </div>
              </div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold">{event.title}</h1>
                {isOrganizer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditDescription}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Description
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground mb-6">{event.description}</p>

              {/* Description Edit Dialog */}
              <Dialog
                open={isDescriptionDialogOpen}
                onOpenChange={setIsDescriptionDialogOpen}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Event Description</DialogTitle>
                    <DialogDescription>
                      Update the description for your event
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description-edit">Description</Label>
                      <Textarea
                        id="description-edit"
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        placeholder="Describe your event..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDescriptionDialogOpen(false);
                          setEditingDescription("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateDescription}>
                        Update Description
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{event.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {event.attendees}/{event.maxAttendees} attendees
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Full day event</p>
                  </div>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={event.organizer.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {event.organizer.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      Organized by {event.organizer.name}
                    </p>
                    {event.organizer.verified && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        Verified Organizer
                      </Badge>
                    )}
                  </div>
                </div>
                {isOrganizer && (
                  <Badge
                    variant="default"
                    className="text-xs"
                  >
                    You are the organizer
                  </Badge>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              defaultValue="schedule"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
              </TabsList>

              {/* Schedule Tab */}
              <TabsContent
                value="schedule"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Event Schedule</h4>
                  {isOrganizer && (
                    <Dialog
                      open={isScheduleDialogOpen}
                      onOpenChange={setIsScheduleDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Schedule Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Schedule Item</DialogTitle>
                          <DialogDescription>
                            Add a new item to the event schedule
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="schedule-time">Time</Label>
                            <Input
                              id="schedule-time"
                              type="time"
                              value={newScheduleItem.time}
                              onChange={(e) =>
                                setNewScheduleItem({
                                  ...newScheduleItem,
                                  time: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="schedule-title">Title</Label>
                            <Input
                              id="schedule-title"
                              value={newScheduleItem.title}
                              onChange={(e) =>
                                setNewScheduleItem({
                                  ...newScheduleItem,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Session title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="schedule-speaker">
                              Speaker (optional)
                            </Label>
                            <Input
                              id="schedule-speaker"
                              value={newScheduleItem.speaker}
                              onChange={(e) =>
                                setNewScheduleItem({
                                  ...newScheduleItem,
                                  speaker: e.target.value,
                                })
                              }
                              placeholder="Speaker name"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsScheduleDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleAddScheduleItem}>
                              Add Item
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {event.schedules && event.schedules.length > 0 ? (
                  event.schedules.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-sm font-medium text-primary min-w-20">
                          {item.time}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          {item.speaker && (
                            <p className="text-sm text-muted-foreground">
                              by {item.speaker}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOrganizer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveScheduleItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No schedule items added yet.</p>
                    {isOrganizer && (
                      <p className="text-sm mt-2">
                        Add schedule items to help attendees plan their day.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Speakers Tab */}
              <TabsContent
                value="speakers"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Event Speakers</h4>
                  {isOrganizer && (
                    <Dialog
                      open={isSpeakerDialogOpen}
                      onOpenChange={setIsSpeakerDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Speaker
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Speaker</DialogTitle>
                          <DialogDescription>
                            Add a new speaker to the event
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="speaker-name">Name</Label>
                            <Input
                              id="speaker-name"
                              value={newSpeaker.name}
                              onChange={(e) =>
                                setNewSpeaker({
                                  ...newSpeaker,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Speaker name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="speaker-role">Role/Title</Label>
                            <Input
                              id="speaker-role"
                              value={newSpeaker.role}
                              onChange={(e) =>
                                setNewSpeaker({
                                  ...newSpeaker,
                                  role: e.target.value,
                                })
                              }
                              placeholder="e.g., CEO at Company"
                            />
                          </div>
                          <div>
                            <Label htmlFor="speaker-avatar">
                              Avatar URL (optional)
                            </Label>
                            <Input
                              id="speaker-avatar"
                              value={newSpeaker.avatar}
                              onChange={(e) =>
                                setNewSpeaker({
                                  ...newSpeaker,
                                  avatar: e.target.value,
                                })
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsSpeakerDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleAddSpeaker}>
                              Add Speaker
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {event.speakers && event.speakers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.speakers.map((speaker, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={speaker.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {speaker.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{speaker.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {speaker.role}
                            </p>
                          </div>
                        </div>
                        {isOrganizer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSpeaker(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No speakers added yet.</p>
                    {isOrganizer && (
                      <p className="text-sm mt-2">
                        Add speakers to showcase your event lineup.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Ticket Purchase */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Purchase Tickets</span>
                  <span className="text-2xl font-bold text-primary">
                    {event.priceDisplay}
                  </span>
                </CardTitle>
                <CardDescription>
                  Secure blockchain-based ticketing on Stacks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ticket availability */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Available:</span>
                    <span className="font-medium">
                      {event.maxAttendees - event.attendees} of{" "}
                      {event.maxAttendees}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (event.attendees / event.maxAttendees) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {event.maxAttendees - event.attendees > 0 ? (
                  <>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={Math.min(10, event.maxAttendees - event.attendees)}
                        value={ticketQuantity}
                        onChange={(e) =>
                          setTicketQuantity(
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ticket Price:</span>
                        <span>{event.priceDisplay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>{ticketQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gas Fee (est.):</span>
                        <span>{gasFee.toFixed(3)} STX</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{(totalPrice + gasFee).toFixed(3)} STX</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handlePurchase}
                      disabled={isPurchasing || !isSignedIn || isOrganizer}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      {isPurchasing
                        ? "Processing..."
                        : isOrganizer
                        ? "You are the organizer"
                        : isSignedIn
                        ? "Buy Tickets"
                        : "Connect Wallet"}
                    </Button>

                    {ticketQuantity > 1 && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        Note: Each ticket requires a separate transaction.
                        You'll need to confirm {ticketQuantity} transactions.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-red-500 font-medium">Event Sold Out</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All tickets have been purchased
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✓ Secure Stacks blockchain transaction</p>
                  <p>✓ Smart contract ticket with proof of ownership</p>
                  <p>✓ Transferable and refundable</p>
                  <p>✓ Instant confirmation</p>
                </div>

                {/* Blockchain info */}
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <p>
                    <strong>Event ID:</strong> {event.id}
                  </p>
                  <p>
                    <strong>Creator:</strong> {event.creator.slice(0, 8)}...
                    {event.creator.slice(-4)}
                  </p>
                  <p>
                    <strong>Network:</strong> Stacks Testnet
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
