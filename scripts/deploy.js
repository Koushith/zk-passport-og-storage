import hre from "hardhat";

async function main() {
  console.log("Deploying ProofRegistry to 0G Mainnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "A0GI");

  const ProofRegistry = await hre.ethers.getContractFactory("ProofRegistry");
  const registry = await ProofRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("\n✅ ProofRegistry deployed to:", address);
  console.log("\nAdd this to your server/.env:");
  console.log(`REGISTRY_CONTRACT=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
