import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const organizer = accounts.get("wallet_1")!;
const buyer = accounts.get("wallet_2")!;
const newUser = accounts.get("wallet_3")!;

describe("EventChain Contract", () => {
  it("should deploy the contract", () => {
    const contract = simnet.getContractSource("eventchain");
    expect(contract).toBeDefined();
  });

  it("should allow deployer to create a new event", () => {
    // First add deployer as organizer
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(deployer)],
      deployer
    );

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
    // First add deployer as organizer
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(deployer)],
      deployer
    );

    // Then create an event
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
  it("should add an organizer (by admin)", () => {
    const addCall = simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );
    expect(addCall.result).toStrictEqual(Cl.ok(Cl.bool(true)));
  });

  it("organizer should create event", () => {
    // First add organizer
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const call = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("EventChain Live 2025"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );
    expect(call.result).toStrictEqual(Cl.ok(Cl.uint(3)));
  });

  it("buyer should buy a ticket", () => {
    // Setup: Add organizer and create event
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("EventChain Live 2025"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    const buy = simnet.callPublicFn(
      "eventchain",
      "buy-ticket",
      [Cl.uint(1)],
      buyer
    );
    expect(buy.result).toStrictEqual(Cl.ok(Cl.bool(true)));
  });

  it("buyer should transfer ticket to another user", () => {
    // Setup: Add organizer, create event, and buy ticket
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("EventChain Live 2025"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    simnet.callPublicFn("eventchain", "buy-ticket", [Cl.uint(1)], buyer);

    const transfer = simnet.callPublicFn(
      "eventchain",
      "transfer-ticket",
      [Cl.uint(1), Cl.principal(newUser)],
      buyer
    );
    expect(transfer.result).toStrictEqual(Cl.ok(Cl.bool(true)));
  });

  it("organizer should check-in the transferred ticket", () => {
    // Setup: Add organizer, create event, buy ticket, and transfer it
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const createEventResult = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("EventChain Live 2025"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    // Extract the actual event ID from the result
    const eventId = (createEventResult.result as any).value.value;

    simnet.callPublicFn(
      "eventchain",
      "buy-ticket",
      [Cl.uint(eventId)],
      buyer
    );

    simnet.callPublicFn(
      "eventchain",
      "transfer-ticket",
      [Cl.uint(eventId), Cl.principal(newUser)],
      buyer
    );

    const checkin = simnet.callPublicFn(
      "eventchain",
      "check-in-ticket",
      [Cl.uint(eventId), Cl.principal(newUser)],
      organizer
    );
    expect(checkin.result).toStrictEqual(Cl.ok(Cl.bool(true)));
  });
});
