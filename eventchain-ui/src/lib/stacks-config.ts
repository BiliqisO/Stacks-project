import * as StacksNet from "@stacks/network"

/**
 * Return a Stacks network instance regardless of whether
 * `StacksTestnet` is exported as a class or a factory function.
 */
function getTestnet() {
  const T = (StacksNet as any).StacksTestnet
  // If T is a class (has a prototype with a constructor) → use `new`.
  if (typeof T === "function" && T.prototype && T.prototype.constructor === T) {
    return new T()
  }
  // Otherwise assume it’s a factory function → call it directly.
  return typeof T === "function" ? T() : T
}

export const NETWORK = getTestnet() // Use `getMainnet()` for production
export const CONTRACT_ADDRESS = "ST2EC0NW05CA1PK148ZTPJMFH8NPY0ZWM1RCJNFB9"
export const CONTRACT_NAME = "eventchain"

export const STACKS_CONFIG = {
  network: NETWORK,
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  appName: "EventChain",
  appIconUrl: "/logo.png",
}
