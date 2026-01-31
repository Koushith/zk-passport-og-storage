import express from 'express';
import cors from 'cors';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file manually
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const TESTNET_RPC = 'https://evmrpc-testnet.0g.ai/';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

// Demo mode - set to true when 0G testnet is down
const DEMO_MODE = process.env.DEMO_MODE === 'true';

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
    const proofJson = JSON.stringify(proofArtifact, null, 2);
    const demoHash = '0x' + createHash('sha256').update(proofJson).digest('hex');

    // Store proof locally
    const filePath = join(DEMO_STORAGE_DIR, `${demoHash}.json`);
    writeFileSync(filePath, proofJson);
    console.log('DEMO MODE: Stored at', demoHash);

    return res.json({
      success: true,
      rootHash: demoHash,
      txHash: '0xdemo_' + Date.now(),
      walletAddress: 'demo-mode',
      note: 'DEMO MODE - Proof stored locally (0G testnet down)',
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
    const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
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

    const [txHash, uploadErr] = await indexer.upload(zgFile, TESTNET_RPC, signer);

    await zgFile.close();
    unlinkSync(tempPath);

    if (uploadErr) {
      throw new Error(`Upload error: ${uploadErr}`);
    }

    console.log('Upload successful! Tx:', txHash);

    res.json({
      success: true,
      rootHash,
      txHash,
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
      const proofData = JSON.parse(readFileSync(localPath, 'utf-8'));
      return res.json({
        success: true,
        rootHash: hash,
        proofData,
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
    const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
    const signer = new ethers.Wallet(privateKey, provider);
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);

    res.json({
      address,
      balance: ethers.formatEther(balance),
      network: '0G Newton Testnet',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`0G Storage API running on port ${PORT}`);
  console.log(`Make sure PRIVATE_KEY is set in server/.env`);
});
