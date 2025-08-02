console.log("=== DEBUGGING NEXT EVENT ID ===");
const totalEvents = simnet.callReadOnlyFn("eventchain", "get-total-events", [], "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM");
console.log("Total events result:", totalEvents.result);
