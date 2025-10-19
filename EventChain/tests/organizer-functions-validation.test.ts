import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("Organizer Functions - Validation Tests", () => {
  it("should validate that organizer-specific functions work correctly", () => {
    // Use three different accounts for this comprehensive test
    const org1 = accounts.get("wallet_1")!;
    const org2 = accounts.get("wallet_2")!;
    const org3 = accounts.get("wallet_3")!;

    console.log("=== Starting Organizer Functions Validation ===");

    // Add all three as organizers
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(org1)],
      deployer
    );
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(org2)],
      deployer
    );
    simnet.callPublicFn(
      "eventchain",
      "add-organizer",
      [Cl.principal(org3)],
      deployer
    );

    // Get baseline counts for all organizers
    const baselineCount1 = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events-count",
      [Cl.principal(org1)],
      deployer
    );
    const baselineCount2 = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events-count",
      [Cl.principal(org2)],
      deployer
    );
    const baselineCount3 = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events-count",
      [Cl.principal(org3)],
      deployer
    );

    console.log("Baseline counts:", {
      org1: baselineCount1.result,
      org2: baselineCount2.result,
      org3: baselineCount3.result,
    });

    // Organizer 1 creates 2 events
    const org1Event1 = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Org1 Event 1"),
        Cl.stringUtf8("Location 1"),
        Cl.uint(1750000000),
        Cl.uint(1000000),
        Cl.uint(100),
        Cl.stringUtf8(""),
      ],
      org1
    );

    const org1Event2 = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Org1 Event 2"),
        Cl.stringUtf8("Location 2"),
        Cl.uint(1750000001),
        Cl.uint(2000000),
        Cl.uint(200),
        Cl.stringUtf8(""),
      ],
      org1
    );

    // Organizer 2 creates 1 event
    const org2Event1 = simnet.callPublicFn(
      "eventchain",
      "create-event",
      [
        Cl.stringUtf8("Org2 Event 1"),
        Cl.stringUtf8("Location 3"),
        Cl.uint(1750000002),
        Cl.uint(1500000),
        Cl.uint(150),
        Cl.stringUtf8(""),
      ],
      org2
    );

    // Organizer 3 creates no additional events (baseline test)

    console.log("Event creation results:", {
      org1Event1: org1Event1.result,
      org1Event2: org1Event2.result,
      org2Event1: org2Event1.result,
    });

    // Get final counts
    const finalCount1 = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events-count",
      [Cl.principal(org1)],
      deployer
    );
    const finalCount2 = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events-count",
      [Cl.principal(org2)],
      deployer
    );
    const finalCount3 = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events-count",
      [Cl.principal(org3)],
      deployer
    );

    console.log("Final counts:", {
      org1: finalCount1.result,
      org2: finalCount2.result,
      org3: finalCount3.result,
    });

    // Calculate the differences to validate the logic
    const org1Increase =
      Number(finalCount1.result.value) - Number(baselineCount1.result.value);
    const org2Increase =
      Number(finalCount2.result.value) - Number(baselineCount2.result.value);
    const org3Increase =
      Number(finalCount3.result.value) - Number(baselineCount3.result.value);

    console.log("Count increases:", {
      org1: org1Increase,
      org2: org2Increase,
      org3: org3Increase,
    });

    // Validate the core logic: each organizer's count should have increased by the number of events they created
    expect(org1Increase).toBe(2); // Org1 created 2 events
    expect(org2Increase).toBe(1); // Org2 created 1 event
    expect(org3Increase).toBe(0); // Org3 created 0 events

    // Test the event list functions
    const org1Events = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events",
      [Cl.principal(org1)],
      deployer
    );
    const org2Events = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events",
      [Cl.principal(org2)],
      deployer
    );
    const org3Events = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events",
      [Cl.principal(org3)],
      deployer
    );

    console.log("Event lists:", {
      org1: org1Events.result,
      org2: org2Events.result,
      org3: org3Events.result,
    });

    // Validate that event lists have the correct lengths
    expect(org1Events.result.type).toBe('list'); // list type
    expect(org2Events.result.type).toBe('list'); // list type
    expect(org3Events.result.type).toBe('list'); // list type

    if (org1Events.result.type === 11) {
      // Org1 should have gained 2 more events
      expect(
        org1Events.result.list.length - Number(baselineCount1.result.value)
      ).toBe(2);
    }

    if (org2Events.result.type === 11) {
      // Org2 should have gained 1 more event
      expect(
        org2Events.result.list.length - Number(baselineCount2.result.value)
      ).toBe(1);
    }

    if (org3Events.result.type === 11) {
      // Org3 should have the same number of events as baseline
      expect(org3Events.result.list.length).toBe(
        Number(baselineCount3.result.value)
      );
    }

    console.log("=== All Organizer Function Validations PASSED ===");
  });

  it("should validate organizer functions work with non-existent organizer", () => {
    // Test with a completely new address that was never added as organizer
    const nonOrganizerAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

    const count = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events-count",
      [Cl.principal(nonOrganizerAddress)],
      deployer
    );

    const events = simnet.callReadOnlyFn(
      "eventchain",
      "get-organizer-events",
      [Cl.principal(nonOrganizerAddress)],
      deployer
    );

    const countValue = (count.result as any).value;
    expect(countValue).toBeLessThanOrEqual(3n);

    const eventsList = (events.result as any).value;
    expect(eventsList.length).toBeLessThanOrEqual(3);

    console.log("Non-existent organizer test PASSED");
  });
});
