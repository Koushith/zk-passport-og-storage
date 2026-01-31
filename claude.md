ZKPassport × 0G Proof Storage — Specification

Project Name

zk-proof-vault (working title)

One-liner

Reusable zero-knowledge identity proofs generated via ZKPassport and stored on 0G for decentralized, trustless verification — without exposing personal data.

⸻

Problem

Current identity and KYC systems:
• Require repeated verification across apps
• Leak or centralize sensitive personal data
• Rely on trusted backends and opaque APIs
• Are hard to compose in Web3-native systems

Even privacy-preserving ZK identity proofs are often:
• Ephemeral
• App-specific
• Stored on centralized servers

⸻

Solution

A minimal infrastructure layer that: 1. Generates zero-knowledge proofs using ZKPassport 2. Stores proof artifacts on 0G decentralized storage / DA 3. Optionally anchors proof hashes on 0G EVM chain for revocation & indexing 4. Enables any verifier to fetch and verify proofs trustlessly

No PII. No accounts. No centralized backend.

⸻

Goals
• Reusable ZK identity proofs
• Decentralized, censorship-resistant storage
• Trustless verification
• Hackathon-viable MVP

Non-Goals
• Full DID system
• Passport or document storage
• Token economics
• Wallet UX polish

⸻

Actors
• User: Generates a ZK proof using ZKPassport
• Issuer (ZKPassport): Produces valid ZK proofs
• Storage Layer (0G): Stores proof artifacts
• Verifier App: Fetches and verifies proofs
• Registry Contract (optional): Anchors proof hashes

⸻

Architecture Overview

User
└─ ZKPassport SDK
└─ Generates ZK Proof (π) + Public Signals

Client / Backend
├─ Package proof artifact
├─ Upload to 0G Storage / DA
│ └─ Returns content hash
└─ (Optional) Register hash on 0G EVM chain

Verifier
├─ Fetch proof from 0G via hash
├─ Check on-chain registry (optional)
└─ Verify ZK proof locally

⸻

Proof Artifact Format

Stored as a JSON blob on 0G.

{
"proof": "0x...",
"publicSignals": {
"ageOver18": true,
"countryCodeHash": "0x..."
},
"circuitId": "zkpassport-age-v1",
"issuer": "zkpassport",
"issuedAt": 1738232323,
"expiresAt": 1769768323
}

Notes
• No raw passport data
• Public signals reveal only proven attributes
• Expiry is enforced at verification time

⸻

Storage Layer (0G)

Why 0G
• Decentralized storage with data availability guarantees
• Web3-native integration
• Better composability than IPFS alone

Stored Data
• Full proof artifact JSON

Addressing
• Content-addressed via hash
• Hash used as global proof identifier

⸻

Optional: On-chain Proof Registry (0G EVM)

Purpose
• Proof validity tracking
• Revocation
• Indexing

Stored On-chain
• bytes32 proofHash
• bool valid

Minimal Contract Interface

mapping(bytes32 => bool) public validProofs;

function registerProof(bytes32 proofHash) external {
validProofs[proofHash] = true;
}

function revokeProof(bytes32 proofHash) external {
validProofs[proofHash] = false;
}

⸻

Verification Flow 1. Verifier receives proof hash or storage pointer 2. Fetches proof artifact from 0G 3. Checks:
• Expiry
• (Optional) On-chain validity 4. Runs ZK verification locally using ZKPassport circuits 5. Accepts or rejects proof

No network calls required beyond fetching the blob.

⸻

Security & Privacy Considerations

Privacy
• Zero-knowledge proofs only
• No PII stored or transmitted
• Public proofs reveal only intended attributes

Security
• Proof integrity via content addressing
• Optional on-chain anchoring prevents silent tampering
• Verifier does not trust storage provider

⸻

Example Use Cases
• Human-only access gating
• Anonymous DAO membership
• Compliance proofs without KYC
• AI inference abuse prevention
• Privacy-preserving voting eligibility

⸻

MVP Scope (Hackathon)

Must Have
• ZKPassport proof generation
• Upload proof artifact to 0G
• Fetch + verify proof

Nice to Have
• On-chain hash registry
• Proof expiry handling
• Simple CLI or script demo

⸻

Demo Plan 1. Generate proof (age / country) 2. Upload to 0G → get hash 3. Register hash on-chain (optional) 4. Verifier fetches proof from 0G 5. Verifier validates proof locally

⸻

Open Questions
• Proof revocation UX
• Proof aggregation
• Standardization of public signals

⸻

Summary

This project creates a reusable, decentralized layer for zero-knowledge identity proofs by combining ZKPassport and 0G. Proofs are generated once, stored permanently, and verified trustlessly — enabling privacy-first identity primitives for Web3.
