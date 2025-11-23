const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy CrowdfundingFactory
  console.log("📦 Deploying CrowdfundingFactory...");
  const CrowdfundingFactory = await hre.ethers.getContractFactory("CrowdfundingFactory");
  const factory = await CrowdfundingFactory.deploy();

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ CrowdfundingFactory deployed to:", factoryAddress);

  // Wait for a few block confirmations
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await factory.deploymentTransaction().wait(5);
    console.log("✅ Confirmed!\n");
  }

  // Display deployment summary
  console.log("\n📋 Deployment Summary");
  console.log("═══════════════════════════════════════");
  console.log("Network:", hre.network.name);
  console.log("CrowdfundingFactory:", factoryAddress);
  console.log("═══════════════════════════════════════\n");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    factory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to:", `deployments/${hre.network.name}.json\n`);

  // Instructions for next steps
  if (hre.network.name === "sepolia") {
    console.log("📝 Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${factoryAddress}`);
    console.log("2. Update frontend .env with factory address");
    console.log("3. Update backend .env with factory address");
    console.log("4. Update subgraph config with factory address\n");
  }

  console.log("✨ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
