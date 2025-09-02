"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, DollarSign, Upload, X } from "lucide-react";
import { createEvent } from "@/lib/stacks-utils";
import { useStacks } from "@/hooks/useStacks";
import { useRouter } from "next/navigation";
import { PinataSDK } from "pinata";

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    price: "",
    maxTickets: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useStacks();
  const router = useRouter();

  // Upload image to IPFS using PinataSDK
  const uploadToIPFS = async (file: File): Promise<string> => {
    try {
      // Check if JWT token is available
      const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (!pinataJwt) {
        console.warn('⚠️ NEXT_PUBLIC_PINATA_JWT not configured, skipping IPFS upload');
        throw new Error('IPFS configuration not available');
      }

      // Initialize Pinata SDK - for client-side usage, we'll use JWT token
      const pinata = new PinataSDK({
        pinataJwt: pinataJwt,
      });

      // Upload file using the modern PinataSDK
      const result = await pinata.upload.public.file(file);
      console.log("✅ Uploaded successfully to IPFS with CID:", result.cid);
      
      return result.cid; // Returns the IPFS CID
    } catch (error) {
      console.error('❌ IPFS upload error:', error);
      throw new Error('Failed to upload image to IPFS. Please try again or create event without image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      let imageHash = "";
      
      // Upload image to IPFS if selected
      if (selectedImage) {
        setUploadingToIPFS(true);
        try {
          imageHash = await uploadToIPFS(selectedImage);
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
          console.log("Image uploaded to IPFS:", imageHash);
          console.log("Image accessible at:", imageUrl);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          // Continue without image rather than failing the entire event creation
          setError("Image upload failed, creating event without image");
        } finally {
          setUploadingToIPFS(false);
        }
      }

      // Combine date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      const timestamp = Math.floor(eventDateTime.getTime() / 1000);
      
      // Convert price to microSTX
      const priceInMicroSTX = Math.floor(parseFloat(formData.price) * 1000000);

      await createEvent(
        formData.title,
        formData.location,
        timestamp,
        priceInMicroSTX,
        parseInt(formData.maxTickets),
        imageHash
      );

      // Store additional metadata (including IPFS hash) in localStorage
      // In a real application, you might want to store this in a separate contract or database
      if (imageHash || formData.description) {
        const eventMetadata = {
          title: formData.title,
          description: formData.description,
          imageHash: imageHash,
          createdAt: new Date().toISOString(),
        };
        
        // Store with multiple key formats for better compatibility
        const eventKey1 = `event-metadata-${formData.title}-${timestamp}`;
        const eventKey2 = `event-metadata-${formData.title}-${formData.location}-${timestamp}`;
        
        localStorage.setItem(eventKey1, JSON.stringify(eventMetadata));
        localStorage.setItem(eventKey2, JSON.stringify(eventMetadata));
        
        console.log("Stored event metadata with keys:", { eventKey1, eventKey2, eventMetadata });
      }

      // Redirect to events page on success
      router.push("/organizer/events");
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsCreating(false);
      setUploadingToIPFS(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to create events
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground">
          Set up your event details and start selling tickets on the blockchain
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Fill out the information for your new event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your event..."
                rows={4}
              />
            </div>

            {/* Event Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
              <div className="space-y-4">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <div className="space-y-2">
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-sm font-medium text-primary hover:text-primary/80">
                            Click to upload an image
                          </span>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageSelect}
                          />
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 5MB. Image will be stored on IPFS.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {uploadingToIPFS && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-sm">Uploading to IPFS...</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Event location"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Price and Max Tickets */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Ticket Price (STX)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTickets">Max Tickets</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxTickets"
                    type="number"
                    min="1"
                    value={formData.maxTickets}
                    onChange={(e) => handleInputChange("maxTickets", e.target.value)}
                    placeholder="100"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || uploadingToIPFS}
                className="flex-1"
              >
                {uploadingToIPFS 
                  ? "Uploading Image..." 
                  : isCreating 
                  ? "Creating Event..." 
                  : "Create Event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}