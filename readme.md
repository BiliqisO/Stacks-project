# 🧬 RoleNFT - Health Role Identity on Stacks Blockchain

RoleNFT is a Clarity smart contract implementing a SIP-009 compliant NFT to assign and manage health-related roles on the Stacks blockchain. Each NFT represents a specific role within a healthcare system (e.g., Patient, Medical Staff) and is associated with a metadata URI.

---

## 📜 Contract Features

- ✅ **SIP-009 Compliance**: Follows the official standard for non-fungible tokens on Stacks.
- 🎭 **Role Assignment**: Each NFT is assigned a role from a predefined list (e.g., Patient, Executive).
- 🧾 **Metadata Storage**: Each role NFT can be linked to a metadata URI (e.g., IPFS JSON file).
- 👥 **Ownership Tracking**: Get owner and balance info via SIP-009 methods.
- 🔁 **Transferability**: NFTs can be transferred between principals.

---

## 🧱 Role Definitions

| Constant                 | Value |
| ------------------------ | ----- |
| `ROLE_PATIENT`           | `u0`  |
| `ROLE_MEDICAL_STAFF`     | `u1`  |
| `ROLE_ADMIN_STAFF`       | `u2`  |
| `ROLE_EXECUTIVE`         | `u3`  |
| `ROLE_NON_MEDICAL_STAFF` | `u4`  |

---

## 🛠️ Public Functions

### `mint-role (recipient principal) (role uint) (uri (string-utf8 256))`

Mints a new NFT to the `recipient` with a role and metadata URI.

- Fails with `err u400` if the role is invalid.
- Returns `ok true` on success.

### `get-role (id uint)`

Fetches the role assigned to the given token ID.

### `get-token-uri (id uint)`

Returns the metadata URI for the given token ID.

### SIP-009 Required Functions

- `get-owner (id uint)`
- `get-balance (owner principal)`
- `transfer (id uint) (sender principal) (recipient principal)`

---

## 🚀 Example Usage

```clarity
;; Mint a Medical Staff NFT
(contract-call? .role-nft mint-role tx-sender u1 "ipfs://Qm.../metadata.json")
```
