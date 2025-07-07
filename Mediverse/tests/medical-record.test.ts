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
  //   it("should deny access by default", () => {
  //     const { result } = simnet.callReadOnlyFn(
  //       "mediverse",
  //       "has-access",
  //       [principal(patient), principal(hospital)],
  //       hospital
  //     );
  //     expect(result).toEqual(bool(false)); // not granted yet
  //   });
  // it("should allow patient to grant access to hospital", () => {
  // const { result } = simnet.callPublicFn(
  // "mediverse",
  // "grant-access",
  // ['${patient.address}, '${hospital.address}],
  // patient
  // );
  // expect(result).toBeOk();
  // });
  // it("should now show hospital has access", () => {
  // const { result } = simnet.callReadOnlyFn(
  // "mediverse",
  // "has-access",
  // ['${patient.address}, '${hospital.address}],
  // hospital
  // );
  // expect(result).toEqual(true, true);
  // });
  // it("should return record URI to hospital after access granted", () => {
  // const { result } = simnet.callReadOnlyFn(
  // "mediverse",
  // "get-record-uri",
  // ['${patient.address}],
  // hospital
  // );
  // expect(result).toBeOk().toEqual('ipfs://patient-record-1');
  // });
  // it("should allow patient to revoke access from hospital", () => {
  // const { result } = simnet.callPublicFn(
  // "mediverse",
  // "revoke-access",
  // ['${patient.address}, '${hospital.address}],
  // patient
  // );
  // expect(result).toBeOk();
  // });
  // it("should deny hospital access after revocation", () => {
  // const { result } = simnet.callReadOnlyFn(
  // "mediverse",
  // "has-access",
  // ['${patient.address}, '${hospital.address}],
  // hospital
  // );
  // expect(result).toEqual(true, false);
  // });
  // it("should deny access to unapproved users", () => {
  // const { result } = simnet.callReadOnlyFn(
  // "mediverse",
  // "get-record-uri",
  // ['${patient.address}],
  // stranger
  // );
  // expect(result).toBeErr();
  // });
});
