import solc from 'solc';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractPath = join(__dirname, '../contracts/ProofRegistry.sol');
const outputDir = join(__dirname, '../artifacts');

// Read contract source
const source = readFileSync(contractPath, 'utf8');

// Prepare input for solc
const input = {
  language: 'Solidity',
  sources: {
    'ProofRegistry.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

// Compile
console.log('Compiling ProofRegistry.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
  output.errors.forEach((err) => {
    if (err.severity === 'error') {
      console.error('Compilation error:', err.formattedMessage);
      process.exit(1);
    } else {
      console.warn('Warning:', err.formattedMessage);
    }
  });
}

// Extract contract
const contract = output.contracts['ProofRegistry.sol']['ProofRegistry'];

if (!contract) {
  console.error('Contract not found in output');
  process.exit(1);
}

// Create artifacts directory
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Save ABI and bytecode
const artifact = {
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
};

writeFileSync(join(outputDir, 'ProofRegistry.json'), JSON.stringify(artifact, null, 2));
console.log('✅ Compiled successfully!');
console.log('   Artifact saved to: artifacts/ProofRegistry.json');
