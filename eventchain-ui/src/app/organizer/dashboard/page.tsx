"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, TrendingUp, Plus, Eye } from "lucide-react";
import { useStacks } from "@/hooks/useStacks";
import { 
  readOrganizerEvents, 
  readPlatformStats, 
  readRecentActivities 
} from "@/lib/stacks-utils";
import Link from "next/link";

export default function OrganizerDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    activeEvents: 0
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isSignedIn } = useStacks();

  useEffect(() => {
    if (address && isSignedIn) {
      loadDashboardData();
    }
  }, [address, isSignedIn]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load organizer's events
      const events = await readOrganizerEvents(address!);
      setRecentEvents(events.slice(0, 5)); // Latest 5 events

      // Calculate stats
      let totalRevenue = 0;
      let totalTicketsSold = 0;
      let activeEvents = 0;

      events.forEach((event: any) => {
        if (event.result) {
          const eventData = event.result;
          const ticketsSold = eventData["tickets-sold"] || 0;
          const price = eventData.price || 0;
          
          totalTicketsSold += ticketsSold;
          totalRevenue += (ticketsSold * price) / 1000000; // Convert to STX
          
          // Consider event active if it has sold tickets
          if (ticketsSold > 0) {
            activeEvents++;
          }
        }
      });

      setStats({
        totalEvents: events.length,
        totalTicketsSold,
        totalRevenue,
        activeEvents
      });

      // Load recent activities
      const recentActivities = await readRecentActivities();
      setActivities(recentActivities);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the organizer dashboard
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your event overview.
          </p>
        </div>
        <Link href="/organizer/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEvents} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTicketsSold}</div>
            <p className="text-xs text-muted-foreground">
              across all events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} STX</div>
            <p className="text-xs text-muted-foreground">
              lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Event</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEvents > 0 ? (stats.totalRevenue / stats.totalEvents).toFixed(2) : '0.00'} STX
            </div>
            <p className="text-xs text-muted-foreground">
              average revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Your latest events and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentEvents.length > 0 ? (
              <div className="space-y-4">
                {recentEvents.map((event, index) => {
                  const eventData = event.result;
                  const eventName = eventData?.name || `Event ${event.id}`;
                  const ticketsSold = eventData?.["tickets-sold"] || 0;
                  const totalTickets = eventData?.["total-tickets"] || 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{eventName}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticketsSold}/{totalTickets} tickets sold
                        </p>
                      </div>
                      <Link href={`/organizer/events/${event.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No events yet</p>
                <Link href="/organizer/create">
                  <Button>Create Your First Event</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Platform-wide event activities</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${activity.color || 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent activities
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}