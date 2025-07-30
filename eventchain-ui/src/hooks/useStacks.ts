"use client";

import { useState, useEffect } from "react";
import { userSession } from "@/lib/stacks-utils";

export const useStacks = () => {
  const [userData, setUserData] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
        setIsSignedIn(true);
      });
    } else if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setUserData(userData);
      setIsSignedIn(true);
    }
  }, []);

  const getAddress = () => {
    if (userData) {
      return userData.profile.stxAddress.testnet;
    }
    return null;
  };

  return {
    userData,
    isSignedIn,
    address: getAddress(),
  };
};
