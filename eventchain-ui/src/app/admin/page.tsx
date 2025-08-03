"use client";

import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Plus,
  Settings,
  Shield,
  BarChart3,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  readAdminStatus,
  readPlatformStats,
  addOrganizer,
  readOrganizers,
  readRecentActivities,
} from "@/lib/stacks-utils";
import { useStacks } from "@/hooks/useStacks";

export default function AdminPage() {
  const { isSignedIn, address } = useStacks();
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(false);
  const [isAddOrganizerOpen, setIsAddOrganizerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdminStatus, setIsLoadingAdminStatus] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: "0 STX",
    activeOrganizers: 0,
    platformFees: "0 STX",
    monthlyGrowth: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isAddingOrganizer, setIsAddingOrganizer] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState({
    name: "",
    email: "",
    walletAddress: "",
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isSignedIn && address) {
        try {
          setIsLoadingAdminStatus(true);
          const adminStatus = await readAdminStatus(address);
          setIsAdmin(adminStatus);

          if (adminStatus) {
            const stats = await readPlatformStats();
            setPlatformStats({
              totalEvents: stats.totalEvents,
              totalTicketsSold: stats.totalTicketsSold,
              totalRevenue: `${stats.totalRevenue.toFixed(2)} STX`,
              activeOrganizers: stats.totalOrganizers,
              platformFees: `${(stats.totalRevenue * 0.05).toFixed(3)} STX`, // 5% platform fee
              monthlyGrowth: 23.5,
            });

            await loadOrganizers();
            await loadRecentActivities();
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } finally {
          setIsLoadingAdminStatus(false);
        }
      } else {
        setIsAdmin(false);
        setIsLoadingAdminStatus(false);
      }
    };

    checkAdminStatus();
  }, [isSignedIn, address]);

  const loadOrganizers = async () => {
    try {
      setIsLoadingOrganizers(true);
      console.log("Loading organizers from blockchain...");
      const blockchainOrganizers = await readOrganizers();
      console.log("Blockchain organizers:", blockchainOrganizers);

      const transformedOrganizers = blockchainOrganizers.map(
        (org: any, index: number) => ({
          id: index + 1,
          name: `Organizer ${index + 1}`,
          email: "N/A",
          walletAddress: org.address,
          eventsCreated: org.eventsCreated,
          totalRevenue: `${org.totalRevenue} STX`,
          status: org.status,
          joinDate: new Date().toISOString().split("T")[0],
        })
      );

      setOrganizers(transformedOrganizers);
    } catch (error) {
      console.error("Error loading organizers:", error);
      setOrganizers([]);
    } finally {
      setIsLoadingOrganizers(false);
    }
  };

  // Load recent activities from blockchain
  const loadRecentActivities = async () => {
    try {
      setIsLoadingActivities(true);
      console.log("Loading recent activities from blockchain...");
      const activities = await readRecentActivities();
      console.log("Recent activities:", activities);
      setRecentActivities(activities);
    } catch (error) {
      console.error("Error loading recent activities:", error);
      setRecentActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleAddOrganizer = async () => {
    if (!isSignedIn || !isAdmin) {
      alert("You must be an admin to add organizers");
      return;
    }

    if (!newOrganizer.walletAddress) {
      alert("Please enter a wallet address");
      return;
    }

    try {
      setIsAddingOrganizer(true);
      await addOrganizer(newOrganizer.walletAddress);

      await loadOrganizers();
      await loadRecentActivities();
      setNewOrganizer({ name: "", email: "", walletAddress: "" });
      setIsAddOrganizerOpen(false);

      alert("Organizer added successfully!");
    } catch (error) {
      console.error("Error adding organizer:", error);
      alert("Failed to add organizer. Please try again.");
    } finally {
      setIsAddingOrganizer(false);
    }
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    setOrganizers(
      organizers.map((org) =>
        org.id === id ? { ...org, status: newStatus } : org
      )
    );
  };

  if (isLoadingAdminStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Checking admin permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You do not have admin permissions to access this dashboard.
          </p>
          <p className="text-sm text-muted-foreground">
            Connected as: {address}
          </p>
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
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <Badge className="bg-green-500">Admin</Badge>
            </div>
            <Dialog
              open={isAddOrganizerOpen}
              onOpenChange={setIsAddOrganizerOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organizer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Organizer</DialogTitle>
                  <DialogDescription>
                    Add a new event organizer to the platform
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={newOrganizer.name}
                      onChange={(e) =>
                        setNewOrganizer({
                          ...newOrganizer,
                          name: e.target.value,
                        })
                      }
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newOrganizer.email}
                      onChange={(e) =>
                        setNewOrganizer({
                          ...newOrganizer,
                          email: e.target.value,
                        })
                      }
                      placeholder="contact@organization.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <Input
                      id="wallet"
                      value={newOrganizer.walletAddress}
                      onChange={(e) =>
                        setNewOrganizer({
                          ...newOrganizer,
                          walletAddress: e.target.value,
                        })
                      }
                      placeholder="0x..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddOrganizerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddOrganizer}
                    disabled={isAddingOrganizer}
                  >
                    {isAddingOrganizer ? "Adding..." : "Add Organizer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs
          defaultValue="overview"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizers">Organizers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-6"
          >
            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Events
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {platformStats.totalEvents}
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
                    {platformStats.totalTicketsSold}
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
                    {platformStats.totalRevenue}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform fees: {platformStats.platformFees}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Organizers
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {platformStats.activeOrganizers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered organizers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Platform Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading recent activities...
                    </p>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No recent activity found.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Activities will appear here as events are created and
                      tickets are sold.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4"
                      >
                        <div
                          className={`w-2 h-2 ${activity.color} rounded-full`}
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="organizers"
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Event Organizers</CardTitle>
                <CardDescription>
                  Manage event organizers and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrganizers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">
                      Loading organizers from blockchain...
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead>Events</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No organizers found. Add the first organizer to get
                            started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        organizers.map((organizer) => (
                          <TableRow key={organizer.id}>
                            <TableCell className="font-medium">
                              {organizer.name}
                            </TableCell>
                            <TableCell>{organizer.email}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {organizer.walletAddress}
                            </TableCell>
                            <TableCell>{organizer.eventsCreated}</TableCell>
                            <TableCell>{organizer.totalRevenue}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  organizer.status === "active"
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }
                              >
                                {organizer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Select
                                  value={organizer.status}
                                  onValueChange={(value) =>
                                    handleStatusChange(organizer.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="pending">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="suspended">
                                      Suspended
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="analytics"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Revenue Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Revenue chart visualization
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>User Growth</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground">User growth chart</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Event Categories</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Category distribution chart
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Platform Fees</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Fee collection analytics
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
