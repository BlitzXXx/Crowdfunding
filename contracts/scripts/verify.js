const fs = require("fs");
const path = require("path");

const hre = require("hardhat");

/**
 * Verifies deployed contracts on Etherscan (V2 API, chain-agnostic).
 *
 * Usage:
 *   npx hardhat run scripts/verify.js --network sepolia
 *
 * Reads the deployment address from deployments/<network>.json
 * (written by scripts/deploy.js or the Ignition deployment).
 */
async function main() {
  const networkName = hre.network.name;

  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("ℹ️  Verification is not needed on local networks.");
    return;
  }

  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ ETHERSCAN_API_KEY missing. Add it to contracts/.env");
    process.exit(1);
  }

  // Resolve factory address: prefer explicit CLI arg, else deployment file
  let address = process.env.DEPLOY_ADDRESS;
  if (!address) {
    const deploymentPath = path.join(
      __dirname,
      "..",
      "deployments",
      `${networkName}.json`
    );
    if (!fs.existsSync(deploymentPath)) {
      console.error(
        `❌ No deployment file for "${networkName}". Deploy first, or set DEPLOY_ADDRESS=0x...`
      );
      process.exit(1);
    }
    address = JSON.parse(fs.readFileSync(deploymentPath, "utf8")).factory;
  }

  console.log(`🔍 Verifying CrowdfundingFactory at ${address} (${networkName})...\n`);

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: [], // Factory has no constructor args
    });
    console.log("\n✅ Contract verified!");
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Already Verified") ||
        error.message.includes("already verified"))
    ) {
      console.log("\n✅ Contract already verified.");
    } else {
      throw error;
    }
  }

  console.log(`🔗 Explorer: https://${networkName}.etherscan.io/address/${address}#code`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });
