import {
  AppConfig,
  UserSession,
  connect,
  disconnect,
  request,
  isConnected,
  getLocalStorage,
} from "@stacks/connect";
import * as Tx from "@stacks/transactions";
import { STACKS_CONFIG } from "./stacks-config";

const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

const getCoreApiUrl = () => {
  return STACKS_CONFIG.network?.coreApiUrl || "https://api.testnet.hiro.so";
};

async function callContractWithRequest(options: any) {
  try {
    console.log("functionName", options.functionName);
    console.log("functionArgs", options.functionArgs);

    const response = await request("stx_callContract", {
      contract:
        `${options.contractAddress}.${options.contractName}` as `${string}.${string}`,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      network: options.network?.chainId === 2147483648 ? "testnet" : "mainnet",
    });

    console.log("Transaction ID:", response);
    if (options.onFinish) options.onFinish(response);
    return response;
  } catch (error) {
    console.error("Contract call failed:", error);
    if (options.onCancel) options.onCancel();
    throw error;
  }
}

export const connectWallet = async () => {
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

  try {
    await connect();
    console.log("Wallet connected successfully");
    window.location.reload();
  } catch (error) {
    console.error("Connection failed:", error);
  }
};

export const disconnectWallet = () => {
  disconnect();
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

  // Check if user is connected
  if (!isConnected() && !userSession.isUserSignedIn()) {
    throw new Error("User is not connected. Please connect your wallet first.");
  }

  let userAddress = null;
  if (isConnected()) {
    const data = getLocalStorage();
    if (data?.addresses?.stx && data.addresses.stx.length > 0) {
      userAddress = data.addresses.stx[0].address;
    }
  } else if (userSession.isUserSignedIn()) {
    const userData = userSession.loadUserData();
    userAddress = userData.profile.stxAddress.testnet;
  }

  console.log("User address:", userAddress);

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
    console.log("Calling contract with request method with options:", options);
    await callContractWithRequest(options);
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

  await callContractWithRequest(options);
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

  await callContractWithRequest(options);
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

  await callContractWithRequest(options);
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

  await callContractWithRequest(options);
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

  await callContractWithRequest(options);
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
      "Calling contract with request method for addOrganizer with options:",
      options
    );
    await callContractWithRequest(options);
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

export const readOrganizerEvents = async (organizerAddress: string) => {
  try {
    console.log("Fetching events for organizer:", organizerAddress);

    // Get the list of event IDs for this organizer
    const organizerEventsResult = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "get-organizer-events",
      functionArgs: [Tx.principalCV(organizerAddress)],
      network: STACKS_CONFIG.network,
      senderAddress: organizerAddress,
    });

    console.log("Raw organizer events result:", organizerEventsResult);

    // Parse the list response from Clarity
    let eventIds: number[] = [];
    if (organizerEventsResult && typeof organizerEventsResult === "object") {
      // Handle Clarity list response - check both 'list' and 'value' properties
      const listItems =
        (organizerEventsResult as any).list ||
        (organizerEventsResult as any).value;

      if (
        (organizerEventsResult as any).type === "list" &&
        Array.isArray(listItems)
      ) {
        eventIds = listItems
          .map((item: any) => {
            if (item && typeof item === "object" && item.type === "uint") {
              // Handle BigInt values
              const value = item.value;
              if (typeof value === "bigint") {
                return Number(value);
              }
              return parseInt(value.toString());
            }
            return parseInt(item.toString());
          })
          .filter((id) => !isNaN(id));
      }
      // Handle other possible formats
      else if (Array.isArray(organizerEventsResult)) {
        eventIds = organizerEventsResult
          .map((id: any) => {
            if (typeof id === "number") return id;
            if (typeof id === "object" && id.type === "uint") {
              const value = id.value;
              if (typeof value === "bigint") {
                return Number(value);
              }
              return parseInt(String(value));
            }
            return parseInt(String(id));
          })
          .filter((id) => !isNaN(id));
      }
    }

    console.log("Parsed event IDs for organizer:", eventIds);

    // If no events found, return empty array
    if (eventIds.length === 0) {
      console.log("No events found for organizer");
      return [];
    }

    // Fetch individual event details
    const events = [];
    for (const eventId of eventIds) {
      try {
        console.log(`Fetching details for event ${eventId}`);
        const eventResult = await Tx.fetchCallReadOnlyFunction({
          contractAddress: STACKS_CONFIG.contractAddress,
          contractName: STACKS_CONFIG.contractName,
          functionName: "get-event",
          functionArgs: [Tx.uintCV(eventId)],
          network: STACKS_CONFIG.network,
          senderAddress: organizerAddress,
        });

        console.log(`Event ${eventId} result:`, eventResult);
        console.log(`Event ${eventId} result type:`, typeof eventResult);

        if (
          eventResult &&
          eventResult !== "(none)" &&
          (eventResult as any).type !== "none"
        ) {
          // Parse the event data from the optional response
          let eventData = null;
          if (
            (eventResult as any).type === "some" &&
            (eventResult as any).value
          ) {
            // For 'some' type, get the inner value
            const innerValue = (eventResult as any).value;
            if (innerValue.type === "tuple" && innerValue.value) {
              // Extract the tuple data and convert BigInt values
              const tupleData = innerValue.value;
              eventData = {
                creator: tupleData.creator?.value || "",
                name: tupleData.name?.value || "",
                location: tupleData.location?.value || "",
                timestamp: tupleData.timestamp?.value
                  ? Number(tupleData.timestamp.value)
                  : 0,
                price: tupleData.price?.value
                  ? Number(tupleData.price.value)
                  : 0,
                "total-tickets": tupleData["total-tickets"]?.value
                  ? Number(tupleData["total-tickets"].value)
                  : 0,
                "tickets-sold": tupleData["tickets-sold"]?.value
                  ? Number(tupleData["tickets-sold"].value)
                  : 0,
              };
            }
          } else if ((eventResult as any).type !== "none") {
            eventData = eventResult;
          }

          if (eventData) {
            console.log(`Parsed event ${eventId} data:`, eventData);
            events.push({
              id: eventId,
              result: eventData,
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching event ${eventId}:`, error);
      }
    }

    console.log("Final organizer events data:", events);
    return events;
  } catch (error) {
    console.error("Error reading organizer events:", error);
    return [];
  }
};

export const readEvents = async () => {
  try {
    // Get total events count first using fetchCallReadOnlyFunction
    const totalEventsResult = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "get-total-events",
      functionArgs: [],
      network: STACKS_CONFIG.network,
      senderAddress: STACKS_CONFIG.contractAddress,
    });

    console.log("Raw total events response:", totalEventsResult);

    // Parse the Clarity result properly
    let totalEvents = 0;
    if (totalEventsResult) {
      // Handle different possible return formats
      if (typeof totalEventsResult === "number") {
        totalEvents = totalEventsResult;
      } else if (
        typeof totalEventsResult === "object" &&
        totalEventsResult.type === "uint"
      ) {
        totalEvents = parseInt(String(totalEventsResult.value || "0"));
      } else {
        const resultStr = totalEventsResult.toString();
        if (resultStr.startsWith("u")) {
          totalEvents = parseInt(resultStr.substring(1));
        } else {
          totalEvents = parseInt(resultStr);
        }
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
        const eventResult = await Tx.fetchCallReadOnlyFunction({
          contractAddress: STACKS_CONFIG.contractAddress,
          contractName: STACKS_CONFIG.contractName,
          functionName: "get-event",
          functionArgs: [Tx.uintCV(i)],
          network: STACKS_CONFIG.network,
          senderAddress: STACKS_CONFIG.contractAddress,
        });

        if (eventResult && (eventResult as any) !== "(none)") {
          events.push({
            id: i,
            result: eventResult, // Store the raw result for processing
          });
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

    // Use the fetchCallReadOnlyFunction from @stacks/transactions for proper serialization
    const result = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "is-organizer",
      functionArgs: [Tx.principalCV(organizerAddress)],
      network: STACKS_CONFIG.network,
      senderAddress: organizerAddress,
    });

    console.log("Organizer status response for", organizerAddress, ":", result);

    // Handle different possible return types from the contract
    if (typeof result === "boolean") {
      return result;
    }

    // Handle ClarityValue - check if it's a boolean CV or has type 'true'
    if (result && typeof result === "object" && "type" in result) {
      const resultAny = result as any;
      // Handle the case where type is 'true' (meaning true boolean)
      if (resultAny.type === "true") {
        return true;
      }
      // Handle the case where type is 'false' (meaning false boolean)
      if (resultAny.type === "false") {
        return false;
      }
      // Handle standard boolean CV
      return resultAny.type === "bool" && resultAny.value === true;
    }

    // Fallback - check string representation
    const resultStr = (result as any)?.toString() || "";
    return resultStr === "true" || resultStr.includes("true");
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

  if (!isConnected() && !userSession.isUserSignedIn()) {
    console.log("❌ User not connected - cannot test transaction");
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
    callContractWithRequest(testOptions);
    console.log("✅ Test contract call executed");
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

  // Check if user is connected
  if (!isConnected() && !userSession.isUserSignedIn()) {
    throw new Error("User is not connected. Please connect your wallet first.");
  }

  let userAddress = null;
  if (isConnected()) {
    const data = getLocalStorage();
    if (data?.addresses?.stx && data.addresses.stx.length > 0) {
      userAddress = data.addresses.stx[0].address;
    }
  } else if (userSession.isUserSignedIn()) {
    const userData = userSession.loadUserData();
    userAddress = userData.profile.stxAddress.testnet;
  }

  console.log("User address:", userAddress);

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

    // Call request method - it should trigger the wallet popup
    await callContractWithRequest(enhancedOptions);
    console.log("✅ Contract call initiated - wallet popup should appear");
  } catch (error) {
    console.error("❌ Error in addOrganizer:", error);
    throw error;
  }
};
