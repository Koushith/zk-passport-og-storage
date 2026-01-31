import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import cors from 'cors';
import { createHash } from 'crypto';
import { ethers } from 'ethers';
import express from 'express';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file manually
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MAINNET endpoints
const RPC_URL = 'https://evmrpc.0g.ai/';
const INDEXER_RPC = 'https://indexer-storage-turbo.0g.ai';

// ProofRegistry contract
const REGISTRY_CONTRACT = process.env.REGISTRY_CONTRACT;
const REGISTRY_ABI = [
  'function registerProof(bytes32 proofHash) external',
  'function revokeProof(bytes32 proofHash) external',
  'function isProofValid(bytes32 proofHash) external view returns (bool exists, bool valid)',
  'function getProofRecord(bytes32 proofHash) external view returns (bool exists, bool valid, uint256 registeredAt, uint256 revokedAt, address registeredBy)',
];

// Demo mode disabled - using mainnet
const DEMO_MODE = false;

// Demo storage directory
const DEMO_STORAGE_DIR = join(__dirname, '.demo-storage');
if (DEMO_MODE && !existsSync(DEMO_STORAGE_DIR)) {
  mkdirSync(DEMO_STORAGE_DIR, { recursive: true });
}

// Get private key from env
const getPrivateKey = () => {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error('PRIVATE_KEY not set in environment');
  }
  return pk.startsWith('0x') ? pk : `0x${pk}`;
};

// Upload proof to 0G
app.post('/api/upload', async (req, res) => {
  const { proofArtifact } = req.body;

  if (!proofArtifact) {
    return res.status(400).json({ error: 'Missing proofArtifact' });
  }

  // Demo mode - store locally when 0G is down
  if (DEMO_MODE) {
    console.log('DEMO MODE: Storing proof locally...');

    // Get server's signing wallet
    const privateKey = getPrivateKey();
    const wallet = new ethers.Wallet(privateKey);

    // Create proof with hotel attestation
    const proofWithAttestation = {
      ...proofArtifact,
      attestation: {
        hotelId: 'grand-hotel-001',
        verifiedAt: Date.now(),
        verifierAddress: wallet.address,
      },
    };

    const proofJson = JSON.stringify(proofWithAttestation, null, 2);
    const proofHash = '0x' + createHash('sha256').update(proofJson).digest('hex');

    // Hotel signs the proof hash - proves hotel witnessed this verification
    const signature = await wallet.signMessage(proofHash);

    // Final stored object includes signature
    const signedProof = {
      proof: proofWithAttestation,
      proofHash,
      hotelSignature: signature,
      signerAddress: wallet.address,
    };

    // Simulate network delay (1.5-2.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Store proof locally
    const filePath = join(DEMO_STORAGE_DIR, `${proofHash}.json`);
    writeFileSync(filePath, JSON.stringify(signedProof, null, 2));
    console.log('DEMO MODE: Stored signed proof at', proofHash);

    return res.json({
      success: true,
      rootHash: proofHash,
      txHash: '0xdemo_' + Date.now(),
    });
  }

  try {
    const privateKey = getPrivateKey();
    console.log('Uploading proof to 0G...');

    // Create temp file
    const tempPath = join(tmpdir(), `proof-${Date.now()}.json`);
    const proofJson = JSON.stringify(proofArtifact, null, 2);
    writeFileSync(tempPath, proofJson);

    // Create signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const address = await signer.getAddress();
    console.log('Wallet address:', address);

    // Check balance
    const balance = await provider.getBalance(address);
    console.log('Balance:', ethers.formatEther(balance), 'A0GI');

    if (balance === 0n) {
      unlinkSync(tempPath);
      throw new Error('Wallet has no balance. Please fund it from the 0G faucet.');
    }

    // Create ZgFile and get merkle root
    const zgFile = await ZgFile.fromFilePath(tempPath);
    const [tree, treeErr] = await zgFile.merkleTree();

    if (treeErr) {
      unlinkSync(tempPath);
      throw new Error(`Merkle tree error: ${treeErr}`);
    }

    const rootHash = tree.rootHash();
    console.log('Merkle root hash:', rootHash);

    // Upload to 0G
    const indexer = new Indexer(INDEXER_RPC);
    console.log('Starting upload to 0G...');

    const [txHash, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer);

    await zgFile.close();
    unlinkSync(tempPath);

    if (uploadErr) {
      throw new Error(`Upload error: ${uploadErr}`);
    }

    console.log('Upload successful! Tx:', txHash);

    // Register on-chain if contract is configured
    let registryTx = null;
    if (REGISTRY_CONTRACT) {
      try {
        console.log('Registering proof on-chain...');
        const registry = new ethers.Contract(REGISTRY_CONTRACT, REGISTRY_ABI, signer);
        const tx = await registry.registerProof(rootHash);
        await tx.wait();
        registryTx = tx.hash;
        console.log('Registered on-chain! Tx:', registryTx);
      } catch (regErr) {
        console.error('Registry error (non-fatal):', regErr.message);
      }
    }

    res.json({
      success: true,
      rootHash,
      txHash,
      registryTx,
      walletAddress: address,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch/download proof from 0G or demo storage
app.get('/api/proof/:hash', async (req, res) => {
  const { hash } = req.params;

  // Check demo storage first
  if (DEMO_MODE) {
    const localPath = join(DEMO_STORAGE_DIR, `${hash}.json`);
    if (existsSync(localPath)) {
      console.log('DEMO MODE: Found proof locally:', hash);
      const storedData = JSON.parse(readFileSync(localPath, 'utf-8'));

      // Verify hotel signature
      let signatureValid = false;
      let verificationError = null;

      try {
        const recoveredAddress = ethers.verifyMessage(storedData.proofHash, storedData.hotelSignature);
        signatureValid = recoveredAddress.toLowerCase() === storedData.signerAddress.toLowerCase();
      } catch (err) {
        verificationError = err.message;
      }

      return res.json({
        success: true,
        rootHash: hash,
        proofData: storedData.proof,
        hotelAttestation: {
          signatureValid,
          signerAddress: storedData.signerAddress,
          signature: storedData.hotelSignature,
          verificationError,
        },
        source: 'Demo Storage (local)',
      });
    }
  }

  try {
    console.log('Fetching proof from 0G:', hash);

    const indexer = new Indexer(INDEXER_RPC);

    // Download the file to a temp location
    const downloadPath = join(tmpdir(), `download-${Date.now()}.json`);
    const downloadErr = await indexer.download(hash, downloadPath, true);

    if (downloadErr) {
      throw new Error(`Download error: ${downloadErr}`);
    }

    // Read the downloaded file
    const proofData = JSON.parse(readFileSync(downloadPath, 'utf-8'));
    unlinkSync(downloadPath);

    res.json({
      success: true,
      rootHash: hash,
      proofData,
      source: '0G Network',
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(404).json({ error: 'Proof not found: ' + error.message });
  }
});

// Get wallet info
app.get('/api/wallet', async (req, res) => {
  try {
    const privateKey = getPrivateKey();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);

    res.json({
      address,
      balance: ethers.formatEther(balance),
      network: '0G Mainnet',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check on-chain proof status
app.get('/api/registry/:hash', async (req, res) => {
  const { hash } = req.params;

  if (!REGISTRY_CONTRACT) {
    return res.status(400).json({ error: 'Registry contract not configured' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registry = new ethers.Contract(REGISTRY_CONTRACT, REGISTRY_ABI, provider);

    const [exists, valid, registeredAt, revokedAt, registeredBy] = await registry.getProofRecord(hash);

    res.json({
      success: true,
      proofHash: hash,
      onChain: {
        exists,
        valid,
        registeredAt: exists ? Number(registeredAt) * 1000 : null,
        revokedAt: revokedAt > 0 ? Number(revokedAt) * 1000 : null,
        registeredBy: exists ? registeredBy : null,
      },
      contractAddress: REGISTRY_CONTRACT,
    });
  } catch (error) {
    console.error('Registry check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Revoke proof on-chain
app.post('/api/registry/revoke', async (req, res) => {
  const { proofHash } = req.body;

  if (!proofHash) {
    return res.status(400).json({ error: 'Missing proofHash' });
  }

  if (!REGISTRY_CONTRACT) {
    return res.status(400).json({ error: 'Registry contract not configured' });
  }

  try {
    const privateKey = getPrivateKey();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    const registry = new ethers.Contract(REGISTRY_CONTRACT, REGISTRY_ABI, signer);

    console.log('Revoking proof:', proofHash);
    const tx = await registry.revokeProof(proofHash);
    await tx.wait();

    console.log('Revoked! Tx:', tx.hash);

    res.json({
      success: true,
      proofHash,
      txHash: tx.hash,
    });
  } catch (error) {
    console.error('Revoke error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', registryContract: REGISTRY_CONTRACT || null });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`0G Storage API running on port ${PORT}`);
  console.log(`Make sure PRIVATE_KEY is set in server/.env`);
});
