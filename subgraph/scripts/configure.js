/**
 * Generates subgraph.yaml from subgraph.template.yaml for the target network.
 *
 * Usage:
 *   node scripts/configure.js <network>
 *
 * Reads the factory address + start block from (first match wins):
 *   1. contracts/deployments/<network>.json  (written by deploy scripts)
 *   2. networks.json
 *
 * For localhost, the start block defaults to 0 so graph-node can index from genesis.
 */
const fs = require("fs");
const path = require("path");

const network = process.argv[2];

if (!network || !["sepolia", "localhost", "mainnet"].includes(network)) {
  console.error("Usage: node scripts/configure.js <sepolia|localhost|mainnet>");
  process.exit(1);
}

const root = __dirname;
const configPath = path.join(root, "..", "networks.json");
const configs = JSON.parse(fs.readFileSync(configPath, "utf8"));

let { factoryAddress, startBlock } = configs[network] ?? {
  factoryAddress: "0x0000000000000000000000000000000000000000",
  startBlock: 0,
};

// Prefer real deployment info when available
const deploymentPath = path.join(
  root,
  "..",
  "..",
  "contracts",
  "deployments",
  `${network}.json`
);

if (fs.existsSync(deploymentPath)) {
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  if (deployment.factory) {
    factoryAddress = deployment.factory;
    console.log(`Using deployed factory ${factoryAddress} from ${deploymentPath}`);
  }
}

if (!/^0x[a-fA-F0-9]{40}$/.test(factoryAddress) || parseInt(factoryAddress.slice(2, 42), 16) === 0) {
  if (network !== "sepolia") {
    console.error(
      `❌ No valid factory address configured for "${network}".\n` +
        `   Deploy contracts first or set it in subgraph/networks.json`
    );
    process.exit(1);
  }
  // Placeholder is fine for local codegen/build of the sepolia manifest,
  // but a real address must be set before `graph deploy`.
  console.warn("⚠️  Using placeholder factory address — set the real one before deploying!");
}

const template = fs.readFileSync(path.join(root, "..", "subgraph.template.yaml"), "utf8");

const yaml = template
  .replace(/\{\{network\}\}/g, network)
  .replace(/\{\{factoryAddress\}\}/g, factoryAddress)
  .replace(/\{\{startBlock\}\}/g, String(startBlock));

fs.writeFileSync(path.join(root, "..", "subgraph.yaml"), yaml);

console.log(`✅ Generated subgraph.yaml for network "${network}"`);
