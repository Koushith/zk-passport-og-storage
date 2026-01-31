import { ethers } from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from server directory
const envPath = join(__dirname, '../server/.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const RPC_URL = 'https://evmrpc.0g.ai/';

async function main() {
  console.log('Deploying ProofRegistry to 0G Mainnet...\n');

  // Load compiled contract
  const artifactPath = join(__dirname, '../artifacts/ProofRegistry.json');
  if (!existsSync(artifactPath)) {
    console.error('Contract not compiled. Run: node scripts/compile.js');
    process.exit(1);
  }

  const { abi, bytecode } = JSON.parse(readFileSync(artifactPath, 'utf8'));

  // Get private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('PRIVATE_KEY not set in server/.env');
    process.exit(1);
  }

  const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(pk, provider);

  console.log('Deployer address:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'A0GI\n');

  if (balance === 0n) {
    console.error('Wallet has no balance. Please fund it first.');
    process.exit(1);
  }

  // Deploy contract
  console.log('Deploying contract...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log('Waiting for deployment...');
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log('\n✅ ProofRegistry deployed successfully!');
  console.log('   Contract address:', address);
  console.log('\n📝 Add this to your server/.env:');
  console.log(`   REGISTRY_CONTRACT=${address}`);
}

main().catch((error) => {
  console.error('Deployment failed:', error.message);
  process.exit(1);
});
