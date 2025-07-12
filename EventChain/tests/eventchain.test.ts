import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;

describe("EventChain Contract", () => {
  it("should deploy the contract", () => {
    const contract = simnet.getContractSource("eventchain");
    expect(contract).toBeDefined();
  });

  it("should allow deployer to create a new event", () => {
    const createEventCall = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Tech Conference 2025"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000), // timestamp
        Cl.uint(1000000), // price in microSTX
        Cl.uint(100), // total tickets
      ],
      deployer
    );

    expect(createEventCall.result).toStrictEqual(Cl.ok(Cl.uint(1)));
  });

  it("should allow user to buy a ticket", () => {
    // First create an event
    simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Tech Conference 2025"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000), // timestamp
        Cl.uint(1000000), // price in microSTX
        Cl.uint(100), // total tickets
      ],
      deployer
    );

    const buyTicketCall = simnet.callPublicFn(
      "eventchain",
      "buy-ticket",
      [Cl.uint(1)],
      user1
    );

    expect(buyTicketCall.result).toStrictEqual(Cl.ok(Cl.bool(true)));
  });
});
