import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { bool, none, principal, uint } from "@stacks/transactions/dist/cl";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const patient = accounts.get("wallet_1")!;
const hospital = accounts.get("wallet_2")!;
const insurance = accounts.get("wallet_3")!;
const stranger = accounts.get("wallet_4")!;

describe("MediVerse Access Control", () => {
  it("should allow a permitted medical personnel to store their record URI", () => {
    const { result: mintrole } = simnet.callPublicFn(
      "medical-record",
      "mint-role",
      [principal(hospital), uint(1), Cl.stringUtf8("ipfs://hospital-role")],
      patient
    );
    const { result: grantAccessResult } = simnet.callPublicFn(
      "medical-record",
      "grant-access",
      [principal(hospital)],
      patient
    );
    const { result: setRecordResult } = simnet.callPublicFn(
      "medical-record",
      "set-medical-record",
      [principal(patient), Cl.stringUtf8("ipfs://patient-record-1")],
      hospital
    );
    expect(setRecordResult).toBeOk(bool(true));
  });
});
