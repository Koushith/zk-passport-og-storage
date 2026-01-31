import express from 'express';
import cors from 'cors';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const TESTNET_RPC = 'https://evmrpc-testnet.0g.ai/';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

// Upload proof to 0G
app.post('/api/upload', async (req, res) => {
  const { proofArtifact, privateKey } = req.body;

  if (!proofArtifact || !privateKey) {
    return res.status(400).json({ error: 'Missing proofArtifact or privateKey' });
  }

  try {
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

// Fetch proof info from 0G
app.get('/api/proof/:hash', async (req, res) => {
  const { hash } = req.params;

  try {
    console.log('Fetching proof from 0G:', hash);

    const indexer = new Indexer(INDEXER_RPC);
    const fileInfo = await indexer.getFileInfo(hash);

    if (fileInfo) {
      res.json({
        success: true,
        rootHash: hash,
        fileInfo,
        source: '0G Network',
      });
    } else {
      res.status(404).json({ error: 'Proof not found on 0G network' });
    }
  } catch (error) {
    console.error('Fetch error:', error);
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
});
