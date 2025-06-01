import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { bool, none, principal } from "@stacks/transactions/dist/cl";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const patient = accounts.get("wallet_1")!;
const hospital = accounts.get("wallet_2")!;
const insurance = accounts.get("wallet_3")!;
const stranger = accounts.get("wallet_4")!;

describe("MediVerse Access Control", () => {
  it("should allow a patient to store their record URI", () => {
    const { result } = simnet.callPublicFn(
      "medical-record",
      "set-medical-record",
      [Cl.stringUtf8("ipfs://patient-record-1")],
      patient
    );
    expect(result).toBeOk(bool(true));
  });
});
