import { AppConfig, UserSession, showConnect, openContractCall } from "@stacks/connect"
import * as Tx from "@stacks/transactions"
import { STACKS_CONFIG } from "./stacks-config"

const appConfig = new AppConfig(["store_write", "publish_data"])
export const userSession = new UserSession({ appConfig })

export const connectWallet = () => {
  showConnect({
    appDetails: {
      name: STACKS_CONFIG.appName,
      icon: STACKS_CONFIG.appIconUrl,
    },
    redirectTo: "/",
    onFinish: () => {
      window.location.reload()
    },
    userSession,
  })
}

export const disconnectWallet = () => {
  userSession.signUserOut("/")
}

export const createEvent = async (
  name: string,
  location: string,
  timestamp: number,
  price: number,
  totalTickets: number,
) => {
  const functionArgs = [
    Tx.stringUtf8CV(name),
    Tx.stringUtf8CV(location),
    Tx.uintCV(timestamp),
    Tx.uintCV(price),
    Tx.uintCV(totalTickets),
  ]

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "create-event",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Event created:", data)
    },
  }

  await openContractCall(options)
}

export const buyTicket = async (eventId: number, price: number, creatorAddress: string) => {
  const functionArgs = [Tx.uintCV(eventId)]

  // Create post condition to ensure STX transfer
  const postConditions = [
    Tx.makeStandardSTXPostCondition(
      userSession.loadUserData().profile.stxAddress.testnet,
      Tx.FungibleConditionCode.Equal,
      price,
    ),
  ]

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "buy-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditions,
    postConditionMode: Tx.PostConditionMode.Deny,
    onFinish: (data: any) => {
      console.log("Ticket purchased:", data)
    },
  }

  await openContractCall(options)
}

export const transferTicket = async (eventId: number, toAddress: string) => {
  const functionArgs = [Tx.uintCV(eventId), Tx.principalCV(toAddress)]

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "transfer-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Ticket transferred:", data)
    },
  }

  await openContractCall(options)
}

export const checkInTicket = async (eventId: number, userAddress: string) => {
  const functionArgs = [Tx.uintCV(eventId), Tx.principalCV(userAddress)]

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "check-in-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Ticket checked in:", data)
    },
  }

  await openContractCall(options)
}

export const cancelEvent = async (eventId: number) => {
  const functionArgs = [Tx.uintCV(eventId)]

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "cancel-event",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Event cancelled:", data)
    },
  }

  await openContractCall(options)
}

export const refundTicket = async (eventId: number) => {
  const functionArgs = [Tx.uintCV(eventId)]

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "refund-ticket",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Ticket refunded:", data)
    },
  }

  await openContractCall(options)
}

export const addOrganizer = async (organizerAddress: string) => {
  const functionArgs = [Tx.principalCV(organizerAddress)]

  const options = {
    contractAddress: STACKS_CONFIG.contractAddress,
    contractName: STACKS_CONFIG.contractName,
    functionName: "add-organizer",
    functionArgs,
    network: STACKS_CONFIG.network,
    postConditionMode: Tx.PostConditionMode.Allow,
    onFinish: (data: any) => {
      console.log("Organizer added:", data)
    },
  }

  await openContractCall(options)
}
