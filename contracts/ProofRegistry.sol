// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProofRegistry
 * @notice On-chain registry for ZK proof hashes stored on 0G
 * @dev Tracks validity of proofs and enables revocation
 */
contract ProofRegistry {
    // Proof status
    struct ProofRecord {
        bool exists;
        bool valid;
        uint256 registeredAt;
        uint256 revokedAt;
        address registeredBy;
    }

    // Storage
    mapping(bytes32 => ProofRecord) public proofs;
    mapping(address => bool) public authorizedHotels;
    address public owner;

    // Events
    event ProofRegistered(bytes32 indexed proofHash, address indexed hotel, uint256 timestamp);
    event ProofRevoked(bytes32 indexed proofHash, address indexed revokedBy, uint256 timestamp);
    event HotelAuthorized(address indexed hotel);
    event HotelDeauthorized(address indexed hotel);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedHotels[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedHotels[msg.sender] = true;
    }

    /**
     * @notice Register a new proof hash
     * @param proofHash The merkle root hash from 0G storage
     */
    function registerProof(bytes32 proofHash) external onlyAuthorized {
        require(!proofs[proofHash].exists, "Proof already registered");

        proofs[proofHash] = ProofRecord({
            exists: true,
            valid: true,
            registeredAt: block.timestamp,
            revokedAt: 0,
            registeredBy: msg.sender
        });

        emit ProofRegistered(proofHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke a proof (e.g., guest checkout, fraud detection)
     * @param proofHash The proof hash to revoke
     */
    function revokeProof(bytes32 proofHash) external onlyAuthorized {
        require(proofs[proofHash].exists, "Proof not found");
        require(proofs[proofHash].valid, "Already revoked");

        proofs[proofHash].valid = false;
        proofs[proofHash].revokedAt = block.timestamp;

        emit ProofRevoked(proofHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Check if a proof is valid
     * @param proofHash The proof hash to check
     * @return exists Whether the proof was ever registered
     * @return valid Whether the proof is currently valid
     */
    function isProofValid(bytes32 proofHash) external view returns (bool exists, bool valid) {
        ProofRecord memory record = proofs[proofHash];
        return (record.exists, record.valid);
    }

    /**
     * @notice Get full proof record
     * @param proofHash The proof hash to lookup
     */
    function getProofRecord(bytes32 proofHash) external view returns (
        bool exists,
        bool valid,
        uint256 registeredAt,
        uint256 revokedAt,
        address registeredBy
    ) {
        ProofRecord memory record = proofs[proofHash];
        return (
            record.exists,
            record.valid,
            record.registeredAt,
            record.revokedAt,
            record.registeredBy
        );
    }

    /**
     * @notice Authorize a hotel address to register/revoke proofs
     * @param hotel The hotel address to authorize
     */
    function authorizeHotel(address hotel) external onlyOwner {
        authorizedHotels[hotel] = true;
        emit HotelAuthorized(hotel);
    }

    /**
     * @notice Remove hotel authorization
     * @param hotel The hotel address to deauthorize
     */
    function deauthorizeHotel(address hotel) external onlyOwner {
        authorizedHotels[hotel] = false;
        emit HotelDeauthorized(hotel);
    }
}
