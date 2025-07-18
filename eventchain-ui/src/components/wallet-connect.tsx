"use client";

import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { connectWallet, disconnectWallet } from "@/lib/stacks-utils";
import { useStacks } from "@/hooks/useStacks";

export function WalletConnect() {
  const { isSignedIn, address } = useStacks();

  const handleConnect = () => {
    connectWallet();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  if (isSignedIn && address) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">{`${address.slice(
          0,
          6
        )}...${address.slice(-4)}`}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="flex items-center space-x-2"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </Button>
  );
}
