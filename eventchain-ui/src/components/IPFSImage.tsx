"use client";

import React, { useState, useCallback } from 'react';

interface IPFSImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

const isValidIPFSHash = (hash: string): boolean => {
  // Basic IPFS hash validation (CIDv0 and CIDv1)
  if (!hash) return false;
  
  // CIDv0: starts with Qm, 46 characters
  if (hash.startsWith('Qm') && hash.length === 46) return true;
  
  // CIDv1: starts with b, z, or other multibase prefixes
  if (hash.length >= 32 && /^[a-zA-Z0-9]+$/.test(hash)) return true;
  
  return false;
};

export const IPFSImage: React.FC<IPFSImageProps> = ({
  src,
  alt,
  className = "",
  fallback = "/placeholder.svg",
  onLoad,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [attemptedGateways, setAttemptedGateways] = useState<string[]>([]);

  const ipfsGateways = [
    'https://gateway.pinata.cloud/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
    'https://dweb.link/ipfs',
    'https://ipfs.io/ipfs',
    'https://w3s.link/ipfs'
  ];

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Image failed to load:", currentSrc, "Error:", e.nativeEvent);
    
    // Call the original error handler if provided
    if (onError) {
      onError(e.nativeEvent);
    }

    // If it's an IPFS image and we haven't exhausted all gateways
    if (currentSrc && currentSrc.includes('/ipfs/') && !hasError) {
      const ipfsHash = currentSrc.split('/ipfs/')[1];
      const currentGateway = currentSrc.split('/ipfs/')[0];
      
      console.log("IPFS debugging:", { currentSrc, ipfsHash, currentGateway, attemptedGateways });
      
      // Validate IPFS hash before trying other gateways
      if (!isValidIPFSHash(ipfsHash)) {
        console.error("Invalid IPFS hash detected:", ipfsHash);
        setHasError(true);
        setCurrentSrc(fallback);
        return;
      }
      
      // Find gateways we haven't tried yet
      const untried = ipfsGateways.filter(
        gateway => gateway !== currentGateway && !attemptedGateways.includes(gateway)
      );
      
      if (untried.length > 0) {
        const nextGateway = untried[0];
        const nextUrl = `${nextGateway}/${ipfsHash}`;
        console.log("Trying fallback IPFS gateway:", nextUrl);
        
        setAttemptedGateways(prev => [...prev, currentGateway]);
        setCurrentSrc(nextUrl);
        return;
      } else {
        console.warn("All IPFS gateways exhausted for hash:", ipfsHash);
      }
    }

    // All IPFS gateways exhausted or not an IPFS image, use fallback
    console.log("Using fallback image:", fallback);
    setHasError(true);
    setCurrentSrc(fallback);
  }, [currentSrc, attemptedGateways, hasError, fallback, onError]);

  const handleImageLoad = useCallback(() => {
    console.log("Image loaded successfully:", currentSrc);
    if (onLoad) {
      onLoad();
    }
  }, [currentSrc, onLoad]);

  // Reset state when src changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setAttemptedGateways([]);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default IPFSImage;