"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrganizerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace("/organizer/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}