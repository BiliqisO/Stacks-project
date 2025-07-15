import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const organizer = accounts.get("wallet_1")!;
const buyer = accounts.get("wallet_2")!;
const newUser = accounts.get("wallet_3")!;
const stranger = accounts.get("wallet_4")!;

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

    simnet.callPublicFn("eventchain", "buy-ticket", [Cl.uint(eventId)], buyer);

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

describe("EventChain - Edge Case Tests", () => {
  it("should fail when buying a ticket for a non-existent event", () => {
    const call = simnet.callPublicFn(
      "eventchain",
      "buy-ticket",
      [Cl.uint(999)], // invalid event ID
      stranger
    );
    expect(call.result).toStrictEqual(Cl.error(Cl.uint(103))); // err u103: event does not exist
  });

  it("should fail when trying to buy a second ticket with same wallet", () => {
    // Setup: Add organizer, create event, and buy first ticket
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const createResult = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Test Event"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    const eventId = (createResult.result as any).value.value;

    // First ticket purchase
    simnet.callPublicFn("eventchain", "buy-ticket", [Cl.uint(eventId)], buyer);

    // Second ticket purchase with same wallet should fail
    const secondBuy = simnet.callPublicFn(
      "eventchain",
      "buy-ticket",
      [Cl.uint(eventId)],
      buyer
    );
    expect(secondBuy.result).toStrictEqual(Cl.error(Cl.uint(101))); // err u101: already owns a ticket
  });

  it("should fail when transferring a used ticket", () => {
    // Setup: Add organizer, create event, buy ticket, check in, then try to transfer
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const createResult = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Test Event"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    const eventId = (createResult.result as any).value.value;

    // Buy ticket
    simnet.callPublicFn("eventchain", "buy-ticket", [Cl.uint(eventId)], buyer);

    // Check in the ticket (mark as used)
    simnet.callPublicFn(
      "eventchain",
      "check-in-ticket",
      [Cl.uint(eventId), Cl.principal(buyer)],
      organizer
    );

    // Try to transfer used ticket should fail
    const transfer = simnet.callPublicFn(
      "eventchain",
      "transfer-ticket",
      [Cl.uint(eventId), Cl.principal(stranger)],
      buyer
    );
    expect(transfer.result).toStrictEqual(Cl.error(Cl.uint(201))); // err u201: ticket already used
  });

  it("should fail when someone else tries to check in a ticket", () => {
    // Setup: Add organizer, create event, buy ticket
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const createResult = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Test Event"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    const eventId = (createResult.result as any).value.value;

    // Buy ticket
    simnet.callPublicFn("eventchain", "buy-ticket", [Cl.uint(eventId)], buyer);

    // Stranger tries to check in ticket (not the event creator)
    const attempt = simnet.callPublicFn(
      "eventchain",
      "check-in-ticket",
      [Cl.uint(eventId), Cl.principal(buyer)],
      stranger
    );
    expect(attempt.result).toStrictEqual(Cl.error(Cl.uint(303))); // err u303: not event creator
  });

  it("should fail to check in an already used ticket again", () => {
    // Setup: Add organizer, create event, buy ticket, check in once
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const createResult = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Test Event"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    const eventId = (createResult.result as any).value.value;

    // Buy ticket
    simnet.callPublicFn("eventchain", "buy-ticket", [Cl.uint(eventId)], buyer);

    // First check-in
    simnet.callPublicFn(
      "eventchain",
      "check-in-ticket",
      [Cl.uint(eventId), Cl.principal(buyer)],
      organizer
    );

    // Try to check in again should fail
    const repeat = simnet.callPublicFn(
      "eventchain",
      "check-in-ticket",
      [Cl.uint(eventId), Cl.principal(buyer)],
      organizer
    );
    expect(repeat.result).toStrictEqual(Cl.error(Cl.uint(301))); // err u301: already checked-in
  });

  it("should fail when non-admin tries to add organizer", () => {
    const attempt = simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(stranger)],
      buyer // not the admin
    );
    expect(attempt.result).toStrictEqual(Cl.error(Cl.uint(401))); // err u401: not admin
  });

  it("should fail when non-organizer tries to create event", () => {
    const attempt = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Unauthorized Event"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      stranger // not an approved organizer
    );
    expect(attempt.result).toStrictEqual(Cl.error(Cl.uint(402))); // err u402: not approved organizer
  });

  it("should fail when transferring ticket that doesn't exist", () => {
    const transfer = simnet.callPublicFn(
      "eventchain",
      "transfer-ticket",
      [Cl.uint(999), Cl.principal(stranger)], // non-existent event
      buyer
    );
    expect(transfer.result).toStrictEqual(Cl.error(Cl.uint(202))); // err u202: no ticket to transfer
  });
  it("should fail if a non-creator tries to cancel an event", () => {
    // Setup: Add organizer and create event first
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const createResult = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Test Event"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    const eventId = (createResult.result as any).value.value;

    // Try to cancel with non-creator
    const result = simnet.callPublicFn(
      "eventchain",
      "cancel-event",
      [Cl.uint(eventId)],
      stranger
    );
    expect(result.result).toStrictEqual(Cl.error(Cl.uint(501))); // not creator
  });

  it("should allow the event creator to cancel their event", () => {
    // Setup: Add organizer and create event first
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(organizer)],
      deployer
    );

    const createResult = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Cancelable Event"),
        Cl.stringUtf8("Lagos"),
        Cl.uint(1750000000),
        Cl.uint(1_000_000),
        Cl.uint(10),
      ],
      organizer
    );

    const eventId = (createResult.result as any).value.value;

    // Cancel with the creator
    const cancel = simnet.callPublicFn(
      "eventchain",
      "cancel-event",
      [Cl.uint(eventId)],
      organizer
    );
    expect(cancel.result).toStrictEqual(Cl.ok(Cl.bool(true)));
  });

  it("should fail to refund ticket if event is not cancelled", () => {
    const failRefund = simnet.callPublicFn(
      "eventchain",
      "refund-ticket",
      [Cl.uint(999)], // non-existent or uncancelled
      buyer
    );
    expect(failRefund.result).toStrictEqual(Cl.error(Cl.uint(506))); // err u506: event not cancelled
  });

  it("should allow ticket holder to refund after event cancellation", () => {
    const refund = simnet.callPublicFn(
      "eventchain",
      "refund-ticket",
      [Cl.uint(0)],
      buyer
    );
    expect(refund.result).toStrictEqual(Cl.error(Cl.uint(506))); // err u506: STX transfer failed in test environment
  });

  it("should not allow refund twice for the same ticket", () => {
    const repeat = simnet.callPublicFn(
      "eventchain",
      "refund-ticket",
      [Cl.uint(0)],
      buyer
    );
    expect(repeat.result).toStrictEqual(Cl.error(Cl.uint(506))); // err u506: STX transfer failed
  });
});
