import { ClarityType } from "@stacks/transactions";
import { principal, none, bool } from "@stacks/transactions/dist/cl";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const admin = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

describe("decentralized-health.clar", () => {
  it("should allow a new user to sign up without a referer", () => {
    const { result } = simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      admin
    );
    expect(result).toBeOk(bool(true));
  });
});
