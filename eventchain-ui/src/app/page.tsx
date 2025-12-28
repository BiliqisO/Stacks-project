"use client";

import React from "react";
import { useState } from "react";
import { Search, Filter, Calendar, MapPin, Users, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvents } from "@/hooks/useEvents";
import IPFSImage from "@/components/IPFSImage";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { events, isLoading, error } = useEvents();

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" ||
      event.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Decentralized Event Ticketing
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Secure, transparent, and blockchain-powered event management on
            Stacks
          </p>
          <div className="flex justify-center mb-6">
            <Link href="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="music">Music</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8">Upcoming Events</h3>
          
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">Loading events from blockchain...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Failed to load events: {error}</p>
              <Button onClick={refetch}>Retry</Button>
            </div>
          )}
          
          {/* No Events State */}
          {!isLoading && !error && filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {events.length === 0 ? "No events found on the blockchain." : "No events match your search criteria."}
              </p>
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Events will appear here once they are created by organizers.
                </p>
              )}
            </div>
          )}
          
          {/* Events Grid */}
          {!isLoading && !error && filteredEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                console.log("🏠 Home page rendering event:", event.title, "Image:", event.image);
                return (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-muted">
                  <IPFSImage
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    fallback="/placeholder.svg"
                    onLoad={() => console.log("✅ Home page image loaded:", event.title, event.image)}
                    onError={() => console.log("❌ Home page image failed:", event.title, event.image)}
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{event.category}</Badge>
                    <span className="text-sm font-medium text-primary">
                      {event.priceDisplay}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {event.date} at {event.time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{event.attendees} attendees</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      by {event.organizer}
                    </span>
                    <Link href={`/event/${event.id}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
