"use client";

import { useStacks } from "@/hooks/useStacks";
import { connectWallet, disconnectWallet } from "@/lib/stacks-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnect() {
  const { address, isSignedIn } = useStacks();

  const handleConnect = async () => {
    try {
      await connectWallet(() => {
        // Reload user data after successful connection
        window.location.reload();
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  if (isSignedIn && address) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-xs">
          <Wallet className="h-3 w-3 mr-1" />
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="h-8"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} size="sm">
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}