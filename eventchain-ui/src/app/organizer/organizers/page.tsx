"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Mail, Calendar, Settings } from "lucide-react";
import { useStacks } from "@/hooks/useStacks";

interface Organizer {
  id: string;
  address: string;
  name?: string;
  email?: string;
  role: "admin" | "organizer" | "moderator";
  joinedDate: string;
  eventsCreated: number;
  status: "active" | "pending" | "inactive";
}

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { address, isSignedIn } = useStacks();

  useEffect(() => {
    if (isSignedIn && address) {
      loadOrganizers();
    }
  }, [isSignedIn, address]);

  const loadOrganizers = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - in a real app, this would fetch from the blockchain
      const mockOrganizers: Organizer[] = [
        {
          id: "1",
          address: address || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
          name: "Current User",
          email: "user@example.com",
          role: "admin",
          joinedDate: new Date().toISOString().split('T')[0],
          eventsCreated: 3,
          status: "active"
        },
        {
          id: "2",
          address: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
          name: "Alice Johnson",
          email: "alice@example.com",
          role: "organizer",
          joinedDate: "2024-01-15",
          eventsCreated: 7,
          status: "active"
        },
        {
          id: "3",
          address: "ST2JHG361ZXG51QTQAQQXFQT3JVRRQN6D9GQRT9K",
          name: "Bob Smith",
          email: "bob@example.com",
          role: "organizer",
          joinedDate: "2024-02-20",
          eventsCreated: 2,
          status: "active"
        },
        {
          id: "4",
          address: "ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB",
          name: "Carol Davis",
          email: "carol@example.com",
          role: "moderator",
          joinedDate: "2024-03-10",
          eventsCreated: 1,
          status: "pending"
        }
      ];

      setOrganizers(mockOrganizers);
    } catch (error) {
      console.error("Error loading organizers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrganizers = organizers.filter(organizer =>
    organizer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    organizer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    organizer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "organizer":
        return "bg-blue-500";
      case "moderator":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "inactive":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to manage organizers
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizers</h1>
          <p className="text-muted-foreground">
            Manage your event organizing team
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite Organizer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizers.length}</div>
            <p className="text-xs text-muted-foreground">
              across all roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizers.filter(o => o.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizers.filter(o => o.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">
              awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizers.reduce((total, org) => total + org.eventsCreated, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              events created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Organizers List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : filteredOrganizers.length > 0 ? (
          filteredOrganizers.map((organizer) => (
            <Card key={organizer.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                          {organizer.name || "Unnamed Organizer"}
                        </h3>
                        <Badge className={getRoleColor(organizer.role)}>
                          {organizer.role}
                        </Badge>
                        <Badge className={getStatusColor(organizer.status)}>
                          {organizer.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {organizer.address}
                      </p>
                      {organizer.email && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {organizer.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{organizer.eventsCreated}</p>
                      <p className="text-xs text-muted-foreground">events</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{organizer.joinedDate}</p>
                      <p className="text-xs text-muted-foreground">joined</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No organizers match your search." : "Start by inviting your first organizer."}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Organizer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}