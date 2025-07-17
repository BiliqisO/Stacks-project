"use client";

import React from "react";
import { useState } from "react";
import { Search, Filter, Calendar, MapPin, Users } from "lucide-react";
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
import { WalletConnect } from "@/components/wallet-connect";

const mockEvents = [
  {
    id: 1,
    title: "Web3 Developer Conference 2024",
    description: "Join the biggest Web3 developer conference of the year",
    date: "2024-03-15",
    time: "09:00 AM",
    location: "San Francisco, CA",
    price: "500000", // Price in microSTX (0.5 STX)
    priceDisplay: "0.5 STX",
    category: "Technology",
    attendees: 500,
    image: "/placeholder.svg?height=200&width=300",
    organizer: "TechDAO",
  },
  {
    id: 2,
    title: "NFT Art Exhibition",
    description: "Discover the latest in digital art and NFT collections",
    date: "2024-03-20",
    time: "02:00 PM",
    location: "New York, NY",
    price: "200000", // Price in microSTX (0.2 STX)
    priceDisplay: "0.2 STX",
    category: "Art",
    attendees: 200,
    image: "/placeholder.svg?height=200&width=300",
    organizer: "ArtCollective",
  },
  {
    id: 3,
    title: "DeFi Summit 2024",
    description: "Explore the future of decentralized finance",
    date: "2024-03-25",
    time: "10:00 AM",
    location: "London, UK",
    price: "800000", // Price in microSTX (0.8 STX)
    priceDisplay: "0.8 STX",
    category: "Finance",
    attendees: 800,
    image: "/placeholder.svg?height=200&width=300",
    organizer: "DeFiDAO",
  },
];

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      event.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">EventChain</h1>
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/"
                  className="text-primary font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/organizer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Organizer
                </Link>
                <Link
                  href="/tickets"
                  className="text-muted-foreground hover:text-primary"
                >
                  My Tickets
                </Link>
                <Link
                  href="/check-in"
                  className="text-muted-foreground hover:text-primary"
                >
                  Check-in
                </Link>
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:text-primary"
                >
                  Admin
                </Link>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-muted">
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-full object-cover"
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
