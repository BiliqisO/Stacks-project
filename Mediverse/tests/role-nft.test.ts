import { Cl } from "@stacks/transactions";
import { bool, principal, some, uint } from "@stacks/transactions/dist/cl";
import { describe, it, expect, beforeAll } from "vitest";

const accounts = simnet.getAccounts();
const admin = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

describe("role-nft.clar", () => {
  it("should return correct owner for token", () => {
    simnet.callPublicFn(
      "role-nft",
      "mint-role",
      [
        principal(alice),
        uint(1),
        Cl.stringUtf8(
          "ipfs://bafkreibnwna6ne5hqhsbs5wlyxxatkw2hm3sdqrng3by3t45qkof4q7e4a"
        ),
      ],
      admin
    );

    const { result } = simnet.callReadOnlyFn(
      "role-nft",
      "get-owner",
      [uint(1)],
      admin
    );

    expect(result).toEqual(some(principal(alice)));
  });

  it("should return correct token URI", () => {
    // Mint first
    simnet.callPublicFn(
      "role-nft",
      "mint-role",
      [
        principal(alice),
        uint(0),
        Cl.stringUtf8(
          "ipfs://bafkreibnwna6ne5hqhsbs5wlyxxatkw2hm3sdqrng3by3t45qkof4q7e4a"
        ),
      ],
      admin
    );
    // Then query token URI
    const { result } = simnet.callReadOnlyFn(
      "role-nft",
      "get-token-uri",
      [uint(1)],
      alice
    );
    expect(result).toBeOk(
      Cl.stringUtf8(
        "ipfs://bafkreibnwna6ne5hqhsbs5wlyxxatkw2hm3sdqrng3by3t45qkof4q7e4a"
      )
    );
  });

  it("should return correct role assigned to token", () => {
    simnet.callPublicFn(
      "role-nft",
      "mint-role",
      [
        principal(alice),
        uint(0),
        Cl.stringUtf8(
          "ipfs://bafkreibnwna6ne5hqhsbs5wlyxxatkw2hm3sdqrng3by3t45qkof4q7e4a"
        ),
      ],
      admin
    );
    const { result } = simnet.callReadOnlyFn(
      "role-nft",
      "get-role",
      [uint(1)],
      alice
    );
    expect(result).toBeOk(uint(0));
  });
  it("should show balance of NFT for owner", () => {
    const { result } = simnet.callReadOnlyFn(
      "role-nft",
      "get-balance",
      [principal(alice)],
      alice
    );
    expect(result).toBeOk(uint(0));
  });
  it("should transfer NFT between users", () => {
    // Step 1: Mint the NFT to Alice
    simnet.callPublicFn(
      "role-nft",
      "mint-role",
      [
        principal(alice),
        uint(0), // ROLE_PATIENT
        Cl.stringUtf8(
          "ipfs://bafkreibnwna6ne5hqhsbs5wlyxxatkw2hm3sdqrng3by3t45qkof4q7e4a"
        ),
      ],
      admin
    );

    // Step 2: Transfer it from Alice to Bob
    const { result } = simnet.callPublicFn(
      "role-nft",
      "transfer",
      [uint(1), principal(alice), principal(bob)],
      alice
    );

    expect(result).toBeOk(bool(true));
  });

  it("should reflect new owner after transfer", () => {
    simnet.callPublicFn(
      "role-nft",
      "mint-role",
      [
        principal(alice),
        uint(0), // ROLE_PATIENT
        Cl.stringUtf8(
          "ipfs://bafkreibnwna6ne5hqhsbs5wlyxxatkw2hm3sdqrng3by3t45qkof4q7e4a"
        ),
      ],
      admin
    );

    // Step 2: Transfer it from Alice to Bob
    const { result: transferResult } = simnet.callPublicFn(
      "role-nft",
      "transfer",
      [uint(1), principal(alice), principal(bob)],
      alice
    );

    const { result: ownerResult } = simnet.callReadOnlyFn(
      "role-nft",
      "get-owner",
      [uint(1)],
      bob
    );
    expect(ownerResult).toEqual(some(principal(bob)));
  });
  it("should fail to mint NFT with invalid role", () => {
    const { result } = simnet.callPublicFn(
      "role-nft",
      "mint-role",
      [principal(bob), uint(999), Cl.stringUtf8("ipfs://invalid-role")],
      admin
    );
    expect(result).toBeErr(uint(400));
  });
  it("should return error for non-existent token URI", () => {
    const { result } = simnet.callReadOnlyFn(
      "role-nft",
      "get-token-uri",
      [uint(999)],
      admin
    );
    expect(result).toBeErr(uint(404));
  });
  it("should return error for role of non-existent token", () => {
    const { result } = simnet.callReadOnlyFn(
      "role-nft",
      "get-role",
      [uint(999)],
      admin
    );
    expect(result).toBeErr(uint(404));
  });
});
