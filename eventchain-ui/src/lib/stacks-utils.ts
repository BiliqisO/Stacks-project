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
    const response = await request("stx_callContract", {
      contract:
        `${options.contractAddress}.${options.contractName}` as `${string}.${string}`,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      network: options.network?.chainId === 2147483648 ? "testnet" : "mainnet",
    });

    console.log("✅ Transaction submitted successfully:", response);
    if (options.onFinish) options.onFinish(response);
    return response;
  } catch (error) {
    console.error("❌ Contract call failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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
  totalTickets: number,
  image: string = ""
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
    Tx.stringUtf8CV(image),
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

export const getTicketInfo = async (ticketId: number) => {
  try {
    console.log("Getting ticket info for ID:", ticketId);

    const result = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "get-ticket-info",
      functionArgs: [Tx.uintCV(ticketId)],
      network: STACKS_CONFIG.network,
      senderAddress: STACKS_CONFIG.contractAddress,
    });

    console.log("Ticket info result:", result);
    return result;
  } catch (error) {
    console.error("Error getting ticket info:", error);
    return null;
  }
};

export const isTicketValid = async (ticketId: number) => {
  try {
    console.log("Checking if ticket ID is valid:", ticketId);

    const result = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "is-ticket-valid",
      functionArgs: [Tx.uintCV(ticketId)],
      network: STACKS_CONFIG.network,
      senderAddress: STACKS_CONFIG.contractAddress,
    });

    console.log("Ticket validity result:", result);
    return result;
  } catch (error) {
    console.error("Error checking ticket validity:", error);
    return false;
  }
};

export const buyTicket = async (
  eventId: number,
  price: number,
  creatorAddress: string
) => {
  console.log("=== Buy Ticket Debug ===");
  console.log("Event ID:", eventId);
  console.log("Price (microSTX):", price);
  console.log("Creator Address:", creatorAddress);

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

  if (!userAddress) {
    throw new Error("Unable to get user address");
  }

  const functionArgs = [Tx.uintCV(eventId)];

  // Use Allow mode to let the smart contract handle STX transfers internally
  // This avoids post-condition issues with different Stacks.js versions
  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "buy-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("✅ Ticket purchased successfully:", data);
      console.log("Transaction ID:", data.txId);
      alert(`Ticket purchase successful! Transaction ID: ${data.txId}`);
      // Refresh the page to show the new ticket
      if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 2000);
      }
    },
    onCancel: () => {
      console.log("❌ Purchase cancelled by user");
      throw new Error("Transaction cancelled by user");
    },
  };

  try {
    console.log(
      "🔄 Using direct request method to avoid post-condition issues"
    );

    const response = await request("stx_callContract", {
      contract:
        `${STACKS_CONFIG.contractAddress}.${STACKS_CONFIG.contractName}` as `${string}.${string}`,
      functionName: "buy-ticket",
      functionArgs: functionArgs,
      network:
        STACKS_CONFIG.network?.chainId === 2147483648 ? "testnet" : "mainnet",
      postConditionMode: "allow", // Explicitly set to allow mode
    });

    console.log("✅ Buy ticket transaction submitted:", response);
    alert(
      `Ticket purchase initiated! Transaction ID: ${response}\n\nNote: In the improved contract, this will return your Ticket ID for easy check-in.`
    );

    // Refresh the page to show the new ticket
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 2000);
    }

    return response;
  } catch (error) {
    console.error("❌ Direct request method failed, trying fallback:", error);

    // Fallback to the wrapper function
    console.log("Calling buy-ticket with options:", options);
    await callContractWithRequest(options);
  }
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

export const checkInByTicketId = async (ticketId: number) => {
  console.log("=== Check-in by Ticket ID ===");
  console.log("Ticket ID:", ticketId);
  console.log("Contract Address:", STACKS_CONFIG.contractAddress);
  console.log("Contract Name:", STACKS_CONFIG.contractName);

  // First, let's verify the ticket exists and get its details
  try {
    console.log("Checking if ticket ID exists...");
    const ticketInfoResult = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "get-ticket-info",
      functionArgs: [Tx.uintCV(ticketId)],
      network: STACKS_CONFIG.network,
      senderAddress: STACKS_CONFIG.contractAddress,
    });
    console.log("Ticket info:", ticketInfoResult);
  } catch (debugError) {
    console.error("Debug error:", debugError);
  }

  const functionArgs = [Tx.uintCV(ticketId)];
  console.log("Function Args:", functionArgs);

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "check-in-by-ticket-id",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("✅ Ticket checked in successfully by ID:", data);
    },
    onCancel: () => {
      console.log("❌ Check-in cancelled by user");
      throw new Error("Check-in cancelled by user");
    },
  };

  console.log("About to call contract with options:", options);

  await callContractWithRequest(options);
};

export const checkInTicket = async (eventId: number, userAddress: string) => {
  console.log("=== Check-in Ticket Debug ===");
  console.log("Event ID:", eventId);
  console.log("User Address:", userAddress);
  console.log("Contract Address:", STACKS_CONFIG.contractAddress);
  console.log("Contract Name:", STACKS_CONFIG.contractName);

  // First, let's verify the event exists and get its details
  try {
    console.log("Checking if event exists...");
    const eventResult = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "get-event",
      functionArgs: [Tx.uintCV(eventId)],
      network: STACKS_CONFIG.network,
      senderAddress: userAddress,
    });
    console.log("Event data:", eventResult);

    // Check if user has a ticket
    console.log("Checking if user has ticket...");
    const ticketResult = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "get-ticket",
      functionArgs: [Tx.uintCV(eventId), Tx.principalCV(userAddress)],
      network: STACKS_CONFIG.network,
      senderAddress: userAddress,
    });
    console.log("Ticket data:", ticketResult);
  } catch (debugError) {
    console.error("Debug error:", debugError);
  }

  const functionArgs = [Tx.uintCV(eventId), Tx.principalCV(userAddress)];
  console.log("Function Args:", functionArgs);

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "check-in-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("✅ Ticket checked in successfully:", data);
    },
    onCancel: () => {
      console.log("❌ Check-in cancelled by user");
      throw new Error("Check-in cancelled by user");
    },
  };

  console.log("About to call contract with options:", options);

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

// Check if current user is admin
export const readAdminStatus = async (userAddress: string) => {
  try {
    console.log("Checking admin status for address:", userAddress);

    const result = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "get-admin",
      functionArgs: [],
      network: STACKS_CONFIG.network,
      senderAddress: userAddress,
    });

    console.log("Admin address from contract:", result);

    // Handle different possible return types
    let adminAddress = "";
    if (typeof result === "string") {
      adminAddress = result;
    } else if (result && typeof result === "object") {
      const resultAny = result as any;
      if (resultAny.type === "principal" && resultAny.value) {
        adminAddress = resultAny.value;
      } else if (resultAny.value) {
        adminAddress = resultAny.value.toString();
      }
    }

    // Compare addresses (case-insensitive)
    const isAdmin = adminAddress.toLowerCase() === userAddress.toLowerCase();
    console.log(
      "Is admin:",
      isAdmin,
      "Admin address:",
      adminAddress,
      "User address:",
      userAddress
    );

    return isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Get all organizers with their stats
export const readAllOrganizerStats = async () => {
  try {
    console.log("Fetching all organizer stats...");

    // For now, let's manually check the known organizer from your event
    const knownOrganizerAddress = "ST2W9HYNVNNPXH0G6Z33TBKV61HBGBNJG1DSRA4Y9";
    console.log("Checking known organizer:", knownOrganizerAddress);

    // Check if this address is an organizer and get their events
    const isOrganizer = await readOrganizerStatus(knownOrganizerAddress);
    console.log("Is known address an organizer?", isOrganizer);

    if (isOrganizer) {
      // Get their events
      const organizerEvents = await readOrganizerEvents(knownOrganizerAddress);
      console.log("Organizer events:", organizerEvents);

      // Calculate stats
      let totalRevenue = 0;
      let totalTicketsSold = 0;

      for (const event of organizerEvents) {
        if (event.result) {
          const eventData = event.result as any;
          const ticketsSold = eventData["tickets-sold"] || 0;
          const price = eventData.price || 0;
          const eventRevenue = (ticketsSold * price) / 1000000;

          totalRevenue += eventRevenue;
          totalTicketsSold += ticketsSold;
        }
      }

      const organizers = [
        {
          address: knownOrganizerAddress,
          isApproved: isOrganizer,
          eventsCreated: organizerEvents.length,
          totalRevenue: totalRevenue.toFixed(2),
          totalTicketsSold: totalTicketsSold,
          status: "active",
        },
      ];

      console.log("Organizer stats result:", organizers);
      return organizers;
    }

    // Fallback: Get all events to find organizers (original logic)
    const allEvents = await readEvents();
    console.log("All events fallback:", allEvents);

    // Extract unique organizers from events
    const organizerAddresses = new Set<string>();
    const organizerData: any = {};

    for (const event of allEvents) {
      console.log("Processing event for organizer extraction:", event);
      if (event.result && (event.result as any).creator) {
        const creator = (event.result as any).creator;
        console.log("Found creator:", creator);
        organizerAddresses.add(creator);

        if (!organizerData[creator]) {
          organizerData[creator] = {
            address: creator,
            eventsCreated: 0,
            totalRevenue: 0,
            totalTicketsSold: 0,
          };
        }

        organizerData[creator].eventsCreated++;

        // Calculate revenue for this event
        const ticketsSold = (event.result as any)["tickets-sold"] || 0;
        const price = (event.result as any).price || 0;
        const eventRevenue = (ticketsSold * price) / 1000000; // Convert from microSTX to STX

        console.log(
          `Event stats for ${creator}: tickets=${ticketsSold}, price=${price}, revenue=${eventRevenue}`
        );

        organizerData[creator].totalRevenue += eventRevenue;
        organizerData[creator].totalTicketsSold += ticketsSold;
      } else {
        console.log("Event has no creator or result:", event);
      }
    }

    console.log(
      "Extracted organizer addresses:",
      Array.from(organizerAddresses)
    );
    console.log("Organizer data before status check:", organizerData);

    // Convert to array and check organizer status for each
    const organizers = [];
    for (const address of organizerAddresses) {
      try {
        const isApprovedOrganizer = await readOrganizerStatus(address);
        const data = organizerData[address];

        organizers.push({
          address: address,
          isApproved: isApprovedOrganizer,
          eventsCreated: data.eventsCreated,
          totalRevenue: data.totalRevenue.toFixed(2),
          totalTicketsSold: data.totalTicketsSold,
          status: isApprovedOrganizer ? "active" : "pending",
        });
      } catch (error) {
        console.error(`Error checking status for organizer ${address}:`, error);
      }
    }

    console.log("Organizer stats:", organizers);
    return organizers;
  } catch (error) {
    console.error("Error reading organizer stats:", error);
    return [];
  }
};

// Contract read functions - Updated to match actual contract functions
export const readOrganizers = async () => {
  try {
    // Since the contract doesn't have a get-all-organizers function,
    // we'll use the stats function that analyzes events
    return await readAllOrganizerStats();
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
                image: tupleData.image?.value || "",
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

        if (eventResult && String(eventResult) !== "(none)") {
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
    console.log("=== Checking Organizer Status ===");
    console.log("Address:", organizerAddress);
    console.log(
      "Contract:",
      `${STACKS_CONFIG.contractAddress}.${STACKS_CONFIG.contractName}`
    );
    console.log("Network:", STACKS_CONFIG.network);

    // Use the fetchCallReadOnlyFunction from @stacks/transactions for proper serialization
    const result = await Tx.fetchCallReadOnlyFunction({
      contractAddress: STACKS_CONFIG.contractAddress,
      contractName: STACKS_CONFIG.contractName,
      functionName: "is-organizer",
      functionArgs: [Tx.principalCV(organizerAddress)],
      network: STACKS_CONFIG.network,
      senderAddress: organizerAddress,
    });

    console.log("Raw organizer status response:", result);
    console.log("Response type:", typeof result);
    console.log("Response structure:", JSON.stringify(result, null, 2));

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

// Helper function to format relative time
const getRelativeTime = (timestamp: number) => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const diff = now - timestamp; // Difference in seconds

  // If timestamp is in the future, treat as "Just created" for events
  if (diff < 0) return "Just created";

  if (diff >= 0) {
    if (diff < 60) return "Just now";

    const minutes = Math.floor(diff / 60);
    if (diff < 3600) {
      return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    }

    const hours = Math.floor(diff / 3600);
    if (diff < 86400) {
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    const days = Math.floor(diff / 86400);
    if (diff < 604800) {
      return days === 1 ? "1 day ago" : `${days} days ago`;
    }

    const weeks = Math.floor(diff / 604800);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
};

// Get recent platform activities
export const readRecentActivities = async () => {
  try {
    console.log("Fetching recent platform activities...");

    const activities = [];

    // Get organizers first since we know this works
    const organizers = await readAllOrganizerStats();

    // For each organizer, get their events using the working readOrganizerEvents function
    for (const organizer of organizers) {
      const organizerEvents = await readOrganizerEvents(organizer.address);
      console.log(
        `Events for organizer ${organizer.address}:`,
        organizerEvents
      );

      for (const event of organizerEvents) {
        if (event.result) {
          const eventData = event.result as any;
          console.log("Processing event for activity:", eventData);
          const eventName = eventData.name || `Event ${event.id}`;
          const eventTimestamp =
            eventData.timestamp || Math.floor(Date.now() / 1000);
          const relativeTime = getRelativeTime(eventTimestamp);
          console.log(
            "Event name extracted:",
            eventName,
            "Timestamp:",
            eventTimestamp,
            "Relative time:",
            relativeTime
          );
          const ticketsSold = eventData["tickets-sold"] || 0;

          // Event creation activity
          activities.push({
            type: "event-created",
            icon: "calendar",
            color: "bg-blue-500",
            message: `Event "${eventName}" was created`,
            time: relativeTime,
            timestamp: eventTimestamp,
            data: event,
          });

          // Ticket sales activity (if any tickets sold)
          if (ticketsSold > 0) {
            activities.push({
              type: "ticket-sales",
              icon: "users",
              color: "bg-green-500",
              message: `Event "${eventName}" sold ${ticketsSold} tickets`,
              time: relativeTime,
              timestamp: eventTimestamp,
              data: { ticketsSold, eventName },
            });
          }
        }
      }
    }

    for (const organizer of organizers) {
      const shortAddress = `${organizer.address.slice(
        0,
        6
      )}...${organizer.address.slice(-4)}`;
      const registrationTime = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
      activities.push({
        type: "organizer-registered",
        icon: "user-plus",
        color: "bg-purple-500",
        message: `New organizer ${shortAddress} registered`,
        time: getRelativeTime(registrationTime),
        timestamp: registrationTime,
        data: organizer,
      });
    }

    // Sort activities by timestamp (most recent first) and limit to 5
    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return activities.slice(0, 5);
  } catch (error) {
    console.error("Error reading recent activities:", error);
    return [];
  }
};

export const readPlatformStats = async () => {
  try {
    console.log("Reading platform stats...");

    const allEvents = await readEvents();
    console.log("All events for stats:", allEvents);

    const organizerStats = await readAllOrganizerStats();
    console.log("Organizer stats:", organizerStats);

    let totalTicketsSold = 0;
    let totalRevenue = 0;

    for (const event of allEvents) {
      if (event.result) {
        const eventData = event.result as any;
        const ticketsSold = eventData["tickets-sold"] || 0;
        const price = eventData.price || 0;

        totalTicketsSold += ticketsSold;
        totalRevenue += (ticketsSold * price) / 1000000; // Convert from microSTX to STX
      }
    }

    const stats = {
      totalEvents: allEvents.length,
      totalTicketsSold,
      totalRevenue,
      totalOrganizers: organizerStats.length,
    };

    console.log("Platform stats calculated:", stats);
    return stats;
  } catch (error) {
    console.error("Error reading platform stats:", error);
    return {
      totalEvents: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      totalOrganizers: 0,
    };
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
// Get tickets owned by a specific user
export const readUserTickets = async (userAddress: string) => {
  try {
    console.log("Fetching tickets for user:", userAddress);

    // Get all events first
    const allEvents = await readEvents();
    console.log("All events for user ticket check:", allEvents);

    const userTickets = [];

    // For each event, check if the user owns a ticket by calling get-ticket
    for (const event of allEvents) {
      if (event.result) {
        try {
          // Try to get the user's ticket for this event using get-ticket function
          const ticketResult = await Tx.fetchCallReadOnlyFunction({
            contractAddress: STACKS_CONFIG.contractAddress,
            contractName: STACKS_CONFIG.contractName,
            functionName: "get-ticket",
            functionArgs: [Tx.uintCV(event.id), Tx.principalCV(userAddress)],
            network: STACKS_CONFIG.network,
            senderAddress: userAddress,
          });

          console.log(
            `Ticket result for user ${userAddress} and event ${event.id}:`,
            ticketResult
          );

          // Check if ticket exists (not none)
          let hasTicket = false;
          let isCheckedIn = false;

          if (ticketResult && ticketResult !== "(none)") {
            // Parse the ticket data
            if (typeof ticketResult === "object") {
              const resultAny = ticketResult as any;

              // Handle optional type response
              if (resultAny.type === "some" && resultAny.value) {
                hasTicket = true;
                const ticketData = resultAny.value;

                // Check if the ticket has been used (checked in)
                if (
                  ticketData &&
                  ticketData.type === "tuple" &&
                  ticketData.value
                ) {
                  const tupleData = ticketData.value;
                  if (tupleData.used && tupleData.used.type === "bool") {
                    isCheckedIn = tupleData.used.value === true;
                  }
                }
              } else if (resultAny.type !== "none") {
                hasTicket = true;
                // Try to extract used status from direct tuple
                if (resultAny.used && resultAny.used.type === "bool") {
                  isCheckedIn = resultAny.used.value === true;
                }
              }
            }
          }

          if (hasTicket) {
            console.log(
              `User has ticket for event ${event.id}, checked in: ${isCheckedIn}`
            );
            userTickets.push({
              ...event,
              isCheckedIn,
              status: isCheckedIn ? "used" : "active",
            });
          }
        } catch (error) {
          console.error(`Error checking ticket for event ${event.id}:`, error);
          // Continue to next event instead of breaking
        }
      }
    }

    console.log("User tickets:", userTickets);
    return userTickets;
  } catch (error) {
    console.error("Error reading user tickets:", error);
    return [];
  }
};

// Get transfer history for a user
export const readUserTransferHistory = async (userAddress: string) => {
  try {
    console.log("Fetching transfer history for user:", userAddress);

    // This is a simplified version - in a real implementation, you'd want to
    // query blockchain events or maintain a transfer history in the contract
    const userTickets = await readUserTickets(userAddress);

    const history = userTickets.map((ticket) => {
      const eventData = ticket.result as any;
      const eventName = eventData.name || `Event ${ticket.id}`;
      const timestamp = eventData.timestamp || Math.floor(Date.now() / 1000);
      const date = new Date(timestamp * 1000).toISOString().split("T")[0];

      return {
        id: ticket.id,
        eventTitle: eventName,
        action: "Purchased", // Could be "Purchased", "Transferred", "Received"
        from: "Contract",
        to: userAddress,
        date,
        txHash: `0x${ticket.id.toString(16).padStart(64, "0")}`, // Simplified hash
      };
    });

    console.log("User transfer history:", history);
    return history;
  } catch (error) {
    console.error("Error reading user transfer history:", error);
    return [];
  }
};

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
