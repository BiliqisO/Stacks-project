import { Cl } from "@stacks/transactions";
import {
  bool,
  none,
  principal,
  some,
  uint,
} from "@stacks/transactions/dist/cl";
import { describe, it, expect, beforeAll } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

describe("MediVerse Project", () => {
  it("runs full user onboarding and reward claiming", () => {
    simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(alice), none()],
      deployer
    );
    simnet.callPublicFn(
      "decentralized-health",
      "sign-up",
      [principal(bob), some(principal(alice))],
      deployer
    );

    const { result: claim } = simnet.callPublicFn(
      "decentralized-health",
      "claim-referral-rewards",
      [],
      alice
    );
    expect(claim).toBeOk(bool(true));
    expect(claim).toEqual({
      type: 7,
      value: { type: 3 },
    });
  });

  it("assigns a staff role and mints NFT role", () => {
    simnet.callPublicFn(
      "decentralized-health",
      "assign-staff",
      [principal(bob)],
      deployer
    );
    const { result: nft } = simnet.callPublicFn(
      "role-nft",
      "mint-role",
      [
        principal(bob),
        uint(1),
        Cl.stringUtf8(
          "ipfs://bafkreibnwna6ne5hqhsbs5wlyxxatkw2hm3sdqrng3by3t45qkof4q7e4a"
        ),
      ],
      deployer
    );
    const { result: owner } = simnet.callReadOnlyFn(
      "role-nft",
      "get-owner",
      [uint(1)],
      deployer
    );

    expect(owner).toEqual(some(principal(bob)));
    expect(nft).toBeOk(bool(true));
  });

  it("transfers HLTH tokens as a reward", () => {
    const { result } = simnet.callPublicFn(
      "health-token",
      "transfer",
      [Cl.uint(1000), principal(deployer), principal(bob), none()],
      deployer
    );
    expect(result).toBeOk(bool(true));
    const balance = simnet.callReadOnlyFn(
      "health-token",
      "get-balance",
      [principal(bob)],
      bob
    );
    expect(balance.result).toBeOk(Cl.uint(1000));
  });
});
