import {
  AppConfig,
  UserSession,
  showConnect,
  openContractCall,
} from "@stacks/connect";
import * as Tx from "@stacks/transactions";
import { STACKS_CONFIG } from "./stacks-config";

const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

const getCoreApiUrl = () => {
  return STACKS_CONFIG.network?.coreApiUrl || "https://api.testnet.hiro.so";
};

function getWalletProvider() {
  if (typeof window !== "undefined") {
    if ((window as any).LeatherProvider) return (window as any).LeatherProvider;
    if ((window as any).StacksProvider) return (window as any).StacksProvider;
  }
  return null;
}

async function callContractWithProvider(options: any) {
  const provider = getWalletProvider();
  if (provider && typeof provider.request === "function") {
    const params = {
      contractAddress: options.contractAddress,
      contractName: options.contractName,
      functionName: options.functionName,
      functionArgs: options.functionArgs.map((arg: any) => arg.toString()),
      network: options.network,
      postConditionMode: options.postConditionMode,
    };
    try {
      const result = await provider.request({
        method: "stx_callContract",
        params,
      });
      if (options.onFinish) options.onFinish(result);
      return result;
    } catch (err) {
      console.error("Direct provider call failed:", err);
      console.error("Error details:", JSON.stringify(err));
      if (options.onCancel) options.onCancel();
      throw err;
    }
  } else {
    return openContractCall(options);
  }
}

export const connectWallet = () => {
  console.log("=== Connect Wallet Debug ===");

  if (typeof window !== "undefined") {
    console.log("StacksProvider available:", !!(window as any).StacksProvider);
    console.log(
      "LeatherProvider available:",
      !!(window as any).LeatherProvider
    );
    console.log(
      "Available providers:",
      Object.keys(window).filter((key) => key.includes("Provider"))
    );
  }

  showConnect({
    appDetails: {
      name: STACKS_CONFIG.appName,
      icon: STACKS_CONFIG.appIconUrl,
    },
    redirectTo: "/",
    onFinish: () => {
      console.log(" Wallet connected successfully");
      window.location.reload();
    },
    onCancel: () => {
      console.log(" Wallet connection cancelled");
    },
    userSession,
  });
};

export const disconnectWallet = () => {
  userSession.signUserOut("/");
};

export const createEvent = async (
  name: string,
  location: string,
  timestamp: number,
  price: number,
  totalTickets: number
) => {
  console.log("=== Create Event Debug ===");

  // Check if user is signed in
  if (!userSession.isUserSignedIn()) {
    throw new Error("User is not signed in. Please connect your wallet first.");
  }

  const userData = userSession.loadUserData();
  console.log("User signed in:", userData.profile.stxAddress.testnet);

  const functionArgs = [
    Tx.stringUtf8CV(name),
    Tx.stringUtf8CV(location),
    Tx.uintCV(timestamp),
    Tx.uintCV(price),
    Tx.uintCV(totalTickets),
  ];

  console.log("Function args:", functionArgs);
  console.log("Contract config:", {
    address: STACKS_CONFIG.contractAddress,
    name: STACKS_CONFIG.contractName,
    network: STACKS_CONFIG.network,
  });

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "create-event",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Event created successfully:", data);
      console.log("Transaction ID:", data.txId);
    },
    onCancel: () => {
      console.log("Transaction cancelled by user");
    },
  };

  console.log("About to call openContractCall...");

  if (typeof window !== "undefined") {
    console.log("Window object available");
    console.log("StacksProvider available:", !!(window as any).StacksProvider);
    console.log(
      "LeatherProvider available:",
      !!(window as any).LeatherProvider
    );
    console.log(
      "All window properties with 'provider':",
      Object.keys(window).filter((key) =>
        key.toLowerCase().includes("provider")
      )
    );

    if ((window as any).LeatherProvider) {
      console.log("Leather wallet detected");
    } else {
      console.log("Leather wallet not detected - this could be the issue");
    }
  }

  try {
    console.log(
      "Calling contract with provider (or fallback) with options:",
      options
    );
    await callContractWithProvider(options);
    console.log("Contract call executed - wallet popup should appear");
  } catch (error) {
    console.error("Error in createEvent:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export const buyTicket = async (
  eventId: number,
  price: number,
  creatorAddress: string
) => {
  const functionArgs = [Tx.uintCV(eventId)];

  // Simplified without post conditions for now
  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "buy-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Ticket purchased:", data);
    },
  };

  await openContractCall(options);
};

export const transferTicket = async (eventId: number, toAddress: string) => {
  const functionArgs = [Tx.uintCV(eventId), Tx.principalCV(toAddress)];

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "transfer-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Ticket transferred:", data);
    },
  };

  await openContractCall(options);
};

export const checkInTicket = async (eventId: number, userAddress: string) => {
  const functionArgs = [Tx.uintCV(eventId), Tx.principalCV(userAddress)];

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "check-in-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Ticket checked in:", data);
    },
  };

  await openContractCall(options);
};

export const cancelEvent = async (eventId: number) => {
  const functionArgs = [Tx.uintCV(eventId)];

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "cancel-event",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Event cancelled:", data);
    },
  };

  await openContractCall(options);
};

export const refundTicket = async (eventId: number) => {
  const functionArgs = [Tx.uintCV(eventId)];

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "refund-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Ticket refunded:", data);
    },
  };

  await openContractCall(options);
};

export const addOrganizer = async (organizerAddress: string) => {
  console.log("=== Add Organizer Debug ===");
  console.log("Organizer Address:", organizerAddress);
  console.log("Contract Address:", STACKS_CONFIG.contractAddress);
  console.log("Contract Name:", STACKS_CONFIG.contractName);
  console.log("Network:", STACKS_CONFIG.network);

  const functionArgs = [Tx.principalCV(organizerAddress)];
  console.log("Function Args:", functionArgs);

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "add-organizer",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Transaction finished:", data);
      console.log("Transaction ID:", data.txId);
    },
    onCancel: () => {
      console.log("Transaction cancelled by user");
      throw new Error("Transaction cancelled by user");
    },
  };

  console.log("Transaction options:", options);

  // Check if wallet is available
  if (typeof window !== "undefined") {
    console.log("Window object available");
    console.log("StacksProvider available:", !!(window as any).StacksProvider);
    console.log(
      "LeatherProvider available:",
      !!(window as any).LeatherProvider
    );
    console.log(
      "All window properties with 'provider':",
      Object.keys(window).filter((key) =>
        key.toLowerCase().includes("provider")
      )
    );

    // Check if Leather specifically is available
    if ((window as any).LeatherProvider) {
      console.log("✅ Leather wallet detected in addOrganizer");
    } else {
      console.log(
        " Leather wallet not detected in addOrganizer - this could be the issue"
      );
    }
  }

  try {
    console.log(
      "Calling contract with provider (or fallback) for addOrganizer with options:",
      options
    );
    await callContractWithProvider(options);
    console.log(
      "AddOrganizer contract call executed - wallet popup should appear"
    );
  } catch (error) {
    console.error(" Error in addOrganizer:", error);
    throw error;
  }
};

// Contract read functions - Updated to match actual contract functions
export const readOrganizers = async () => {
  try {
    // Since the contract doesn't have a get-all-organizers function,
    // we'll need to implement this differently or return empty for now
    console.log(
      "Note: Contract doesn't have a get-all-organizers function yet"
    );
    return [];
  } catch (error) {
    console.error("Error reading organizers:", error);
    return [];
  }
};

export const readEvents = async () => {
  try {
    // Get total events count first
    const totalEventsResponse = await fetch(
      `${getCoreApiUrl()}/v2/contracts/call-read/${
        STACKS_CONFIG.contractAddress
      }/${STACKS_CONFIG.contractName}/get-total-events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: STACKS_CONFIG.contractAddress,
          arguments: [],
        }),
      }
    );

    if (!totalEventsResponse.ok) {
      console.log("Could not get total events count");
      return [];
    }

    const totalEventsData = await totalEventsResponse.json();
    console.log("Raw total events response:", totalEventsData);

    // Parse the Clarity result properly
    let totalEvents = 0;
    if (totalEventsData.result) {
      const resultStr = totalEventsData.result.toString();
      if (resultStr.startsWith("u")) {
        totalEvents = parseInt(resultStr.substring(1));
      } else {
        totalEvents = parseInt(resultStr);
      }
    }

    // Sanity check - if the number is too large, default to 0
    if (totalEvents > 1000000 || isNaN(totalEvents)) {
      console.warn(
        "Total events count seems invalid, defaulting to 0:",
        totalEvents
      );
      totalEvents = 0;
    }

    console.log("Parsed total events:", totalEvents);

    // Fetch individual events (up to the first 10 for now)
    const events = [];
    for (let i = 1; i <= Math.min(totalEvents, 10); i++) {
      try {
        const eventResponse = await fetch(
          `${getCoreApiUrl()}/v2/contracts/call-read/${
            STACKS_CONFIG.contractAddress
          }/${STACKS_CONFIG.contractName}/get-event`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: STACKS_CONFIG.contractAddress,
              arguments: [`u${i}`],
            }),
          }
        );

        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          if (eventData.result && eventData.result !== "(none)") {
            events.push({
              id: i,
              ...eventData.result, // This will need parsing based on contract response format
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching event ${i}:`, error);
      }
    }

    console.log("Events data:", events);
    return events;
  } catch (error) {
    console.error("Error reading events:", error);
    return [];
  }
};

export const readOrganizerStatus = async (organizerAddress: string) => {
  try {
    console.log("Checking organizer status for address:", organizerAddress);

    const response = await fetch(
      `${getCoreApiUrl()}/v2/contracts/call-read/${
        STACKS_CONFIG.contractAddress
      }/${STACKS_CONFIG.contractName}/is-organizer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: STACKS_CONFIG.contractAddress,
          arguments: [`'${organizerAddress}`], // Properly format principal argument
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Organizer status response for", organizerAddress, ":", data);

    // Parse boolean result (should be 'true' or 'false')
    return data.result === "true";
  } catch (error) {
    console.error("Error reading organizer status:", error);
    return false;
  }
};

export const readEventDetails = async (eventId: number) => {
  try {
    const response = await fetch(
      `${getCoreApiUrl()}/v2/contracts/call-read/${
        STACKS_CONFIG.contractAddress
      }/${STACKS_CONFIG.contractName}/get-event-details`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: STACKS_CONFIG.contractAddress,
          arguments: [eventId.toString()],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Event details:", data);
    return data.result || null;
  } catch (error) {
    console.error("Error reading event details:", error);
    return null;
  }
};

export const readPlatformStats = async () => {
  try {
    // Read the total events count from the contract
    const totalEventsResponse = await fetch(
      `${getCoreApiUrl()}/v2/contracts/call-read/${
        STACKS_CONFIG.contractAddress
      }/${STACKS_CONFIG.contractName}/get-total-events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: STACKS_CONFIG.contractAddress,
          arguments: [],
        }),
      }
    );

    const totalEventsData = totalEventsResponse.ok
      ? await totalEventsResponse.json()
      : { result: "u0" };
    const totalEvents = parseInt(
      totalEventsData.result?.replace(/^u/, "") || "0"
    );

    console.log("Platform stats - Total events:", totalEvents);

    return {
      totalEvents,
      totalTicketsSold: 0, // Would need to aggregate from individual events
      totalOrganizers: 0, // Would need a way to count approved organizers
    };
  } catch (error) {
    console.error("Error reading platform stats:", error);
    return {
      totalEvents: 0,
      totalTicketsSold: 0,
      totalOrganizers: 0,
    };
  }
};

// Test wallet popup directly
export const testWalletPopup = () => {
  console.log("=== Testing Wallet Popup ===");

  if (!userSession.isUserSignedIn()) {
    console.log("❌ User not signed in - cannot test transaction");
    return;
  }

  const testOptions = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "get-total-events", // Simple read function for testing
    functionArgs: [],
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("✅ Test transaction completed:", data);
    },
    onCancel: () => {
      console.log("❌ Test transaction cancelled");
    },
  };

  console.log("Attempting test transaction...");
  try {
    openContractCall(testOptions);
    console.log("✅ Test openContractCall executed");
  } catch (error) {
    console.error("❌ Test transaction failed:", error);
  }
};

// Test contract connection
export const testContractConnection = async () => {
  try {
    console.log("=== Testing Contract Connection ===");
    console.log("STACKS_CONFIG:", STACKS_CONFIG);
    console.log("Contract Address:", STACKS_CONFIG.contractAddress);
    console.log("Contract Name:", STACKS_CONFIG.contractName);
    console.log("Network:", STACKS_CONFIG.network);

    // Ensure we have a valid network with coreApiUrl
    const coreApiUrl = getCoreApiUrl();
    console.log("Network API URL:", coreApiUrl);

    if (!coreApiUrl) {
      throw new Error("Network coreApiUrl is not configured");
    }

    // Test if the contract exists
    const contractUrl = `${coreApiUrl}/v2/contracts/interface/${STACKS_CONFIG.contractAddress}/${STACKS_CONFIG.contractName}`;
    console.log("Testing contract URL:", contractUrl);

    const response = await fetch(contractUrl);
    console.log("Contract response status:", response.status);

    if (response.ok) {
      const contractInfo = await response.json();
      console.log("Contract found! Functions available:");
      console.log(contractInfo);
      return { success: true, contractInfo };
    } else {
      console.error("Contract not found or not accessible");
      return {
        success: false,
        error: `Contract not found (${response.status})`,
      };
    }
  } catch (error) {
    console.error("Error testing contract connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Enhanced addOrganizer with better error handling
export const addOrganizerDebug = async (organizerAddress: string) => {
  console.log("=== Add Organizer Debug ===");

  // Check if user is signed in
  if (!userSession.isUserSignedIn()) {
    throw new Error("User is not signed in. Please connect your wallet first.");
  }

  const userData = userSession.loadUserData();
  console.log("User data:", userData);
  console.log("User address:", userData.profile.stxAddress.testnet);

  // First test contract connection
  console.log("Testing contract connection...");
  const connectionTest = await testContractConnection();
  if (!connectionTest.success) {
    throw new Error(`Contract connection failed: ${connectionTest.error}`);
  }
  console.log("✅ Contract connection successful");

  console.log("Organizer Address:", organizerAddress);
  console.log("Contract Address:", STACKS_CONFIG.contractAddress);
  console.log("Contract Name:", STACKS_CONFIG.contractName);
  console.log("Network:", STACKS_CONFIG.network);

  const functionArgs = [Tx.principalCV(organizerAddress)];
  console.log("Function Args:", functionArgs);

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "add-organizer",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("✅ Transaction finished successfully:", data);
      console.log("Transaction ID:", data.txId);
      alert(`Transaction submitted! TX ID: ${data.txId}`);
    },
    onCancel: () => {
      console.log("❌ Transaction cancelled by user");
      throw new Error("Transaction cancelled by user");
    },
  };

  console.log("Transaction options:", options);

  try {
    console.log("🔄 Initiating contract call...");
    console.log("About to call openContractCall with options:", options);

    // Enhanced options with better callback handling
    const enhancedOptions = {
      ...options,
      onFinish: (data: any) => {
        console.log("✅ Transaction finished successfully:", data);
        console.log("Transaction ID:", data.txId);
        alert(`Transaction submitted! TX ID: ${data.txId}`);
      },
      onCancel: () => {
        console.log("❌ Transaction cancelled by user");
        throw new Error("Transaction cancelled by user");
      },
    };

    // Call openContractCall - it should trigger the wallet popup
    await openContractCall(enhancedOptions);
    console.log("✅ Contract call initiated - wallet popup should appear");
  } catch (error) {
    console.error("❌ Error in addOrganizer:", error);
    throw error;
  }
};
