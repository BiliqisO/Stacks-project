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
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
    'https://dweb.link/ipfs',
    'https://w3s.link/ipfs'
  ];

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Image failed to load:", currentSrc);
    
    // Call the original error handler if provided
    if (onError) {
      onError(e.nativeEvent);
    }

    // If it's an IPFS image and we haven't exhausted all gateways
    if (currentSrc && currentSrc.includes('/ipfs/') && !hasError) {
      const ipfsHash = currentSrc.split('/ipfs/')[1];
      const currentGateway = currentSrc.split('/ipfs/')[0];
      
      // Find gateways we haven't tried yet
      const untried = ipfsGateways.filter(
        gateway => gateway !== currentGateway && !attemptedGateways.includes(gateway)
      );
      
      if (untried.length > 0) {
        const nextGateway = untried[0];
        const nextUrl = `${nextGateway}/${ipfsHash}`;
        console.log("Trying fallback gateway:", nextUrl);
        
        setAttemptedGateways(prev => [...prev, currentGateway]);
        setCurrentSrc(nextUrl);
        return;
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