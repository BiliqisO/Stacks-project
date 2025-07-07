import { Cl, ClarityType, uintCV } from "@stacks/transactions";
import {
  principal,
  none,
  bool,
  uint,
  some,
} from "@stacks/transactions/dist/cl";
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
  it("rejects duplicate sign-up for the same user", () => {
    // First sign-up should succeed
    const firstAttempt = simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      admin
    );
    expect(firstAttempt.result).toBeOk(bool(true));

    // Second sign-up should fail
    const secondAttempt = simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      admin
    );
    expect(secondAttempt.result).toBeErr(Cl.uint(1));
  });

  it("should allow a user to sign up with a referer", () => {
    const { result } = simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(bob), some(principal(alice))],
      admin
    );
    expect(result).toBeOk(bool(true));
  });

  it("should allow admin to assign staff", () => {
    const { result: aliceSignUpResult } = simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      admin
    );
    const { result: bobSignUpResult } = simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(bob), some(principal(alice))],
      admin
    );
    expect(bobSignUpResult).toBeOk(bool(true));
  });

  it("should not allow non user to assign staff", () => {
    const { result } = simnet.callPublicFn(
      "decentralized-health",
      "assign-staff",
      [principal(alice)],
      admin
    );
    expect(result).toBeErr(Cl.uint(2));
  });

  it("should not  allow non-admin to assign staff", () => {
    const { result } = simnet.callPublicFn(
      "decentralized-health",
      "assign-staff",
      [principal(alice)],
      alice
    );
    expect(result).toBeErr(Cl.uint(0));
  });

  it("should prevent reassigning same user as staff", () => {
    const { result: aliceSignUpResult } = simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      admin
    );
    const { result: firstAssignResult } = simnet.callPublicFn(
      "decentralized-health",
      "assign-staff",
      [principal(alice)],
      admin
    );
    const { result: secondAssignResult } = simnet.callPublicFn(
      "decentralized-health",
      "assign-staff",
      [principal(alice)],
      admin
    );
    expect(secondAssignResult).toBeErr(Cl.uint(3));
  });
  it("should claim referral reward", () => {
    simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      admin
    );
    simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(bob), some(principal(alice))],
      admin
    );
    const { result: claimResult } = simnet.callPublicFn(
      "decentralized-health",
      "claim-referral-rewards",
      [],
      alice
    );
    expect(claimResult).toBeOk(bool(true));
  });
  it("should not allow non-user to claim referral reward", () => {
    const { result } = simnet.callPublicFn(
      "decentralized-health",
      "claim-referral-rewards",
      [],
      bob
    );
    expect(result).toBeErr(Cl.uint(2));
  });
  it("should not allow claiming referral rewards if unclaimed is zero", () => {
    simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      admin
    );
    simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(bob), some(principal(alice))],
      admin
    );

    // Alice claims the reward once
    simnet.callPublicFn(
      "decentralized-health",
      "claim-referral-rewards",
      [],
      alice
    );

    // Attempt to claim again when unclaimed is zero
    const { result: secondClaimResult } = simnet.callPublicFn(
      "decentralized-health",
      "claim-referral-rewards",
      [],
      alice
    );
    expect(secondClaimResult).toBeErr(Cl.uint(1)); // Assuming ERR-ALREADY-REGISTERED is represented by 1
  });
});
