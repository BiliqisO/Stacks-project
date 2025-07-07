import { Cl } from "@stacks/transactions";
import { bool, none, principal } from "@stacks/transactions/dist/cl";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("health-token.clar", () => {
  it("should return the correct token name", () => {
    const { result } = simnet.callReadOnlyFn(
      "health-token",
      "get-name",
      [],
      deployer
    );
    expect(result).toBeOk(Cl.stringAscii("Health Token"));
  });

  it("should allow deployer to transfer HLTH tokens", () => {
    const { result } = simnet.callPublicFn(
      "health-token",
      "transfer",
      [Cl.uint(1000), principal(deployer), principal(wallet1), none()],
      deployer
    );
    expect(result).toBeOk(bool(true));
    const balance = simnet.callReadOnlyFn(
      "health-token",
      "get-balance",
      [principal(wallet1)],
      wallet1
    );
    expect(balance.result).toBeOk(Cl.uint(1000));
  });

  it("should prevent non-owners from transferring from others", () => {
    const { result } = simnet.callPublicFn(
      "health-token",
      "transfer",
      [Cl.uint(1000), principal(deployer), principal(wallet2), none()],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(401));
  });
  it("should allow the contract owner to transfer ownership", () => {
    const { result } = simnet.callPublicFn(
      "health-token",
      "transfer-ownership",
      [principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.stringAscii("Ownership transferred successfully"));

    const newOwner = simnet.callReadOnlyFn(
      "health-token",
      "get-contract-owner",
      [],
      wallet1
    );
    expect(newOwner.result).toBeOk(principal(wallet1));
  });

  it("should prevent non-owners from transferring ownership", () => {
    const { result } = simnet.callPublicFn(
      "health-token",
      "transfer-ownership",
      [principal(wallet2)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(401));
  });
});
