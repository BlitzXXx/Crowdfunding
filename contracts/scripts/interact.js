const hre = require("hardhat");

async function main() {
  // Load deployment info
  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}.json`;

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found for network:", hre.network.name);
    console.log("💡 Run deployment first: npx hardhat run scripts/deploy.js --network", hre.network.name);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📋 Using deployment:", deployment.factory);

  // Get signers
  const [creator, contributor] = await hre.ethers.getSigners();

  // Get factory contract
  const factory = await hre.ethers.getContractAt("CrowdfundingFactory", deployment.factory);

  // Example: Create a campaign
  console.log("\n🎯 Creating a test campaign...");

  const goal = hre.ethers.parseEther("1"); // 1 ETH goal
  const duration = 30 * 24 * 60 * 60; // 30 days
  const ipfsHash = "QmExampleTestCampaign123";

  const tx = await factory.connect(creator).createCampaign(goal, duration, ipfsHash);
  console.log("📤 Transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");

  // Find CampaignCreated event
  const event = receipt.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed.name === "CampaignCreated";
    } catch {
      return false;
    }
  });

  if (event) {
    const parsedEvent = factory.interface.parseLog(event);
    const campaignAddress = parsedEvent.args.campaignAddress;

    console.log("\n🎉 Campaign created!");
    console.log("📍 Campaign address:", campaignAddress);
    console.log("👤 Creator:", parsedEvent.args.creator);
    console.log("🎯 Goal:", hre.ethers.formatEther(parsedEvent.args.goal), "ETH");
    console.log("📅 Deadline:", new Date(Number(parsedEvent.args.deadline) * 1000).toLocaleDateString());

    // Get campaign details
    const campaign = await hre.ethers.getContractAt("Campaign", campaignAddress);
    const details = await campaign.getCampaignDetails();

    console.log("\n📊 Campaign Details:");
    console.log("Creator:", details._creator);
    console.log("Goal:", hre.ethers.formatEther(details._goal), "ETH");
    console.log("Total Funds:", hre.ethers.formatEther(details._totalFunds), "ETH");
    console.log("Goal Reached:", details._goalReached);
    console.log("IPFS Hash:", details._ipfsHash);
    console.log("Contributors:", details._contributorsCount.toString());

    // Example: Make a contribution
    console.log("\n💰 Making a test contribution...");
    const contributionAmount = hre.ethers.parseEther("0.1"); // 0.1 ETH

    const contributeTx = await campaign.connect(contributor).contribute({ value: contributionAmount });
    await contributeTx.wait();

    console.log("✅ Contribution successful!");
    console.log("Amount:", hre.ethers.formatEther(contributionAmount), "ETH");

    // Get updated details
    const updatedDetails = await campaign.getCampaignDetails();
    console.log("\n📊 Updated Campaign:");
    console.log("Total Funds:", hre.ethers.formatEther(updatedDetails._totalFunds), "ETH");
    console.log("Progress:", await campaign.getProgress(), "%");
    console.log("Contributors:", updatedDetails._contributorsCount.toString());
  }

  // Get all campaigns
  console.log("\n📋 All Campaigns:");
  const allCampaigns = await factory.getAllCampaigns();
  console.log("Total campaigns:", allCampaigns.length);

  for (let i = 0; i < allCampaigns.length; i++) {
    console.log(`  ${i + 1}. ${allCampaigns[i]}`);
  }

  console.log("\n✨ Interaction complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:");
    console.error(error);
    process.exit(1);
  });
