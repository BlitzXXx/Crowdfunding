const hre = require("hardhat");

async function main() {
  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}.json`;
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const [creator, contributor] = await hre.ethers.getSigners();
  const factory = await hre.ethers.getContractAt("CrowdfundingFactory", deployment.factory);
  const campaigns = await factory.getAllCampaigns();

  console.log("📋 Campaigns:", campaigns.length);

  const campaign = await hre.ethers.getContractAt("Campaign", campaigns[0]);

  // Contribute 0.5 ETH
  console.log("\n💰 Contributing 0.5 ETH...");
  const tx = await campaign.connect(contributor).contribute({ value: hre.ethers.parseEther("0.5") });
  await tx.wait();
  console.log("✅ Contribution confirmed!");

  const details = await campaign.getCampaignDetails();
  console.log("Total funds:", hre.ethers.formatEther(details._totalFunds), "ETH");
  console.log("Goal reached:", details._goalReached);
  console.log("Contributors:", details._contributorsCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
