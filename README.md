# ZKPassport × 0G: Privacy-First Hotel Check-In

> Reusable zero-knowledge identity proofs stored on 0G decentralized storage with on-chain registry for trustless verification.

## The Problem

Current hotel check-in systems:
- Require guests to hand over physical IDs
- Store sensitive personal data in centralized databases
- Create privacy risks and data breach exposure
- No way to verify without revealing everything

## The Solution

A privacy-preserving hotel check-in system that:
1. **Generates ZK proofs** via ZKPassport (age, nationality, KYC, biometrics)
2. **Stores proofs** on 0G decentralized storage
3. **Registers hashes** on 0G EVM chain for validity tracking
4. **Enables verification** without exposing personal data

**No PII stored. No centralized database. Trustless verification.**

---

## 0G Integration

### 1. 0G Storage (Decentralized Data Availability)

All ZK proof artifacts are stored on 0G's decentralized storage network:

```javascript
// Upload proof to 0G Storage
const zgFile = await ZgFile.fromFilePath(proofPath);
const [tree] = await zgFile.merkleTree();
const rootHash = tree.rootHash();

const indexer = new Indexer(INDEXER_RPC);
const [txHash] = await indexer.upload(zgFile, RPC_URL, signer);
```

**Why 0G Storage?**
- Decentralized & censorship-resistant
- Content-addressed via merkle root hash
- Permanent storage for audit trails
- Web3-native integration

**Endpoints Used:**
- RPC: `https://evmrpc.0g.ai/`
- Indexer: `https://indexer-storage-turbo.0g.ai`

### 2. 0G EVM Chain (On-Chain Registry)

Smart contract deployed on 0G mainnet for proof validity tracking:

**Contract Address:** `0x7A7839650933696B19Fd74063d04764bEd19DA07`

```solidity
contract ProofRegistry {
    struct ProofRecord {
        bool exists;
        bool valid;
        uint256 registeredAt;
        uint256 revokedAt;
        address registeredBy;
    }

    mapping(bytes32 => ProofRecord) public proofs;

    function registerProof(bytes32 proofHash) external;
    function revokeProof(bytes32 proofHash) external;
    function isProofValid(bytes32 proofHash) external view returns (bool, bool);
}
```

**Why On-Chain Registry?**
- Immutable record of proof registration
- Revocation capability (guest checkout, fraud)
- Trustless verification by any third party
- Timestamps for audit compliance

---
### Screenshots

<img width="2056" height="1217" alt="Screenshot 2026-01-31 at 4 31 19 PM" src="https://github.com/user-attachments/assets/6b1d9458-a2dc-4444-bb29-8f98a168267f" />
<img width="2056" height="1217" alt="Screenshot 2026-01-31 at 4 43 09 PM" src="https://github.com/user-attachments/assets/a08bba0b-a0b9-46d7-b31e-12d18f163de7" />
<img width="2056" height="1217" alt="Screenshot 2026-01-31 at 4 43 28 PM" src="https://github.com/user-attachments/assets/0f0d8b73-fc13-4d29-97dd-c8b5b2b506b6" />

<img width="2056" height="1217" alt="Screenshot 2026-01-31 at 4 43 35 PM" src="https://github.com/user-attachments/assets/9fb49446-ca1a-4af8-b748-1b7878662ba5" />
<img width="2056" height="1217" alt="Screenshot 2026-01-31 at 4 43 54 PM" src="https://github.com/user-attachments/assets/7316908a-095b-4a88-8142-56cf28bceaec" />

<img width="2056" height="1217" alt="Screenshot 2026-01-31 at 4 44 01 PM" src="https://github.com/user-attachments/assets/86dd4bf5-60f3-4016-963a-4104b60f0279" />

![IMG_D3D6441F71B0-1](https://github.com/user-attachments/assets/b93a29a0-9951-4b5d-b827-d39da94d9631)


## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Guest Phone   │────▶│  ZKPassport SDK  │────▶│   ZK Proof (π)  │
│  (Passport NFC) │     │                  │     │  + Public Signals│
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Hotel Backend  │◀────│   Proof Artifact │◀────│  Hotel Frontend │
│   (Express.js)  │     │   (JSON blob)    │     │    (React)      │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│   0G Storage    │                   │   0G EVM Chain  │
│  (Proof Data)   │                   │ (ProofRegistry) │
│                 │                   │                 │
│  Returns:       │                   │  Stores:        │
│  - Merkle Root  │                   │  - proofHash    │
│  - Tx Hash      │                   │  - valid bool   │
└─────────────────┘                   │  - timestamps   │
                                      └─────────────────┘
```

---

## Verification Types

| Type | What's Proven | Data Revealed |
|------|---------------|---------------|
| **Age** | Guest is 18+ | Nothing (ZK proof) |
| **Nationality** | Country of citizenship | Nationality only |
| **EU Residency** | Valid EU residence permit | Issuing country |
| **Full KYC** | Complete identity + sanctions | Name, DOB, document |
| **Biometric** | Face matches passport photo | Nothing (ZK proof) |

---

## Proof Artifact Format

Stored on 0G as JSON:

```json
{
  "rawProof": { /* ZK proof data */ },
  "verified": true,
  "type": "age",
  "timestamp": 1706745600000,
  "issuer": "zkpassport",
  "attestation": {
    "hotelId": "grand-hotel-001",
    "verifiedAt": 1706745600000,
    "verifierAddress": "0x..."
  }
}
```

---

## Features

### Guest Check-In (Frontend)
- Elegant hotel-themed UI
- QR code scanning with ZKPassport app
- Real-time proof generation status
- Store proof to 0G with one click

### Staff Portal (Admin)
- Verify proofs by hash
- View on-chain registry status
- Revoke proofs (checkout/fraud)
- Explorer links for transparency

### Security
- Hotel signature on all proofs (tamper detection)
- On-chain revocation capability
- No PII in storage (only ZK proofs)
- Decentralized - no single point of failure

---

## Quick Start

### Prerequisites
- Node.js 20+
- 0G wallet with A0GI tokens (for gas)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd zkp-og

# Install dependencies
npm install
cd server && npm install && cd ..

# Configure environment
# Add your PRIVATE_KEY to server/.env
echo "PRIVATE_KEY=your_private_key_here" > server/.env
echo "REGISTRY_CONTRACT=0x7A7839650933696B19Fd74063d04764bEd19DA07" >> server/.env
```

### Run Locally

```bash
# Terminal 1: Start backend
cd server && node index.js

# Terminal 2: Start frontend
npm run dev
```

### For Mobile Testing (ngrok)

```bash
# Start ngrok for backend
ngrok http 3001

# Update .env with ngrok URL
echo "VITE_API_URL=https://your-ngrok-url.ngrok-free.app/api" > .env

# Restart frontend
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload proof to 0G + register on-chain |
| GET | `/api/proof/:hash` | Fetch proof from 0G storage |
| GET | `/api/registry/:hash` | Check on-chain status |
| POST | `/api/registry/revoke` | Revoke proof on-chain |
| GET | `/api/wallet` | Get wallet info |
| GET | `/api/health` | Health check |

---

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** Express.js + ethers.js
- **ZK Proofs:** ZKPassport SDK
- **Storage:** 0G Storage SDK (@0glabs/0g-ts-sdk)
- **Blockchain:** 0G EVM Mainnet
- **Smart Contract:** Solidity (ProofRegistry)

---

## Project Structure

```
zkp-og/
├── src/
│   ├── App.jsx              # Guest check-in UI
│   ├── Admin.jsx            # Staff verification portal
│   └── components/
│       ├── VerificationCard.jsx
│       └── ResultModal.jsx
├── server/
│   └── index.js             # Backend API (0G integration)
├── contracts/
│   └── ProofRegistry.sol    # On-chain registry contract
├── scripts/
│   ├── compile.js           # Contract compilation
│   └── deploy.js            # Contract deployment
└── artifacts/
    └── ProofRegistry.json   # Compiled contract ABI
```

---

## 0G Explorer Links

- **Storage Explorer:** https://storagescan.0g.ai
- **Chain Explorer:** https://chainscan.0g.ai
- **Contract:** [View on Explorer](https://chainscan.0g.ai/address/0x7A7839650933696B19Fd74063d04764bEd19DA07)

---

## How It Works (Flow)

### 1. Guest Verification
```
Guest opens hotel kiosk → Selects verification type →
Scans QR with ZKPassport app → NFC reads passport →
ZK proof generated on device → Proof sent to hotel
```

### 2. Proof Storage
```
Hotel receives proof → Uploads to 0G Storage →
Gets merkle root hash → Registers hash on-chain →
Returns confirmation to guest
```

### 3. Staff Verification
```
Staff enters proof hash → Fetches from 0G Storage →
Checks on-chain registry → Verifies hotel signature →
Confirms guest identity
```

### 4. Guest Checkout (Revocation)
```
Staff clicks "Revoke" → Calls smart contract →
Proof marked invalid on-chain →
Any future verification shows "Revoked"
```

---

## Use Cases Beyond Hotels

- **Age-gated venues** (clubs, casinos)
- **KYC for DeFi** without data exposure
- **DAO membership** verification
- **Healthcare** patient verification
- **Border control** pre-clearance

---

## Security Model

| Layer | Protection |
|-------|------------|
| **ZK Proofs** | No personal data revealed, only proven attributes |
| **0G Storage** | Decentralized, no central database to breach |
| **On-Chain Registry** | Immutable audit trail, tamper-proof |
| **Hotel Signatures** | Cryptographic signing prevents forgery |
| **Revocation** | Proofs can be invalidated when needed |

---

## License

MIT

---

## Built With

- [ZKPassport](https://zkpassport.id) - Zero-knowledge passport proofs
- [0G Network](https://0g.ai) - Decentralized storage & EVM chain

---

*Built for the 0G Hackathon 2025*
