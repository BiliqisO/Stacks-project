"use client";

import { useState, useEffect } from "react";
import { userSession } from "@/lib/stacks-utils";
import { isConnected, getLocalStorage } from "@stacks/connect";

export const useStacks = () => {
  const [userData, setUserData] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    try {
      if (userSession.isSignInPending()) {
        userSession.handlePendingSignIn().then((userData) => {
          setUserData(userData);
          setIsSignedIn(true);
        }).catch((error) => {
          console.error('Error handling pending sign in:', error);
        });
      } else if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        setUserData(userData);
        setIsSignedIn(true);
      } else if (isConnected()) {
        setIsSignedIn(true);
        const data = getLocalStorage();
        if (data?.addresses?.stx && data.addresses.stx.length > 0) {
          setUserData({
            profile: {
              stxAddress: {
                testnet: data.addresses.stx[0].address,
                mainnet: data.addresses.stx[0].address,
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in useStacks effect:', error);
    }
  }, []);

  const getAddress = () => {
    try {
      if (userData?.profile?.stxAddress?.testnet) {
        return userData.profile.stxAddress.testnet;
      }
      if (isConnected()) {
        const data = getLocalStorage();
        if (data?.addresses?.stx && data.addresses.stx.length > 0) {
          return data.addresses.stx[0].address;
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
    return null;
  };

  return {
    userData,
    isSignedIn: isSignedIn || isConnected(),
    address: getAddress(),
  };
};
