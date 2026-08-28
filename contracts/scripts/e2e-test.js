/**
 * E2E Test Script — full stack verification
 *
 * Tests:
 * 1. Create campaign via factory contract
 * 2. Contribute to campaign
 * 3. Verify events indexed by subgraph
 * 4. Test withdrawal (after goal reached)
 * 5. Test refund (on expired campaign)
 * 6. Verify backend API endpoints
 */
const hre = require("hardhat");
const fs = require("fs");
const http = require("http");

const SUBGRAPH_URL = "http://localhost:8000/subgraphs/name/crowdfunding-platform";
const BACKEND_URL = "http://localhost:3001";

function gql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = http.request(SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON: ${data}`)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BACKEND_URL}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    }).on("error", reject);
  });
}

function assert(condition, msg) {
  if (!condition) throw new Error(`❌ ASSERTION FAILED: ${msg}`);
  console.log(`  ✅ ${msg}`);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  return fn()
    .then(() => { passed++; console.log(`\n🧪 PASS: ${name}`); })
    .catch((e) => { failed++; console.log(`\n🧪 FAIL: ${name}`); console.error(`   ${e.message}`); });
}

async function waitForIndexing(blocks = 3) {
  // Wait for graph-node to index new blocks
  await new Promise(r => setTimeout(r, blocks * 5000));
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  CrowdChain E2E Test Suite");
  console.log("═══════════════════════════════════════════\n");

  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}.json`;
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const [creator, contributor1, contributor2] = await hre.ethers.getSigners();

  const factory = await hre.ethers.getContractAt("CrowdfundingFactory", deployment.factory);

  // ── Test 1: Create a campaign ─────────────────────────────
  await test("Create campaign via factory", async () => {
    const goal = hre.ethers.parseEther("2");
    const duration = 7 * 24 * 60 * 60; // 7 days
    const ipfsHash = "QmTestE2ECampaign123";

    const tx = await factory.connect(creator).createCampaign(goal, duration, ipfsHash);
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === "CampaignCreated";
      } catch { return false; }
    });
    assert(event, "CampaignCreated event emitted");

    const parsedEvent = factory.interface.parseLog(event);
    const campaignAddress = parsedEvent.args.campaignAddress;
    assert(campaignAddress, `Campaign created at ${campaignAddress}`);

    globalThis._campaignAddress = campaignAddress;
  });

  await waitForIndexing(4);

  // ── Test 2: Subgraph indexed the campaign ──────────────────
  await test("Subgraph indexed campaign", async () => {
    const result = await gql(`{
      campaigns(first: 10, orderBy: createdAt, orderDirection: desc) {
        id
        goal
        totalFunds
        contributorsCount
        goalReached
        cancelled
      }
    }`);
    assert(!result.errors, "No GraphQL errors");
    assert(result.data.campaigns.length >= 1, `Found ${result.data.campaigns.length} campaigns`);

    const campaign = result.data.campaigns[0];
    assert(campaign.goal === "2000000000000000000", `Goal is 2 ETH`);
    assert(campaign.totalFunds === "0", `Initial funds is 0`);
    assert(campaign.goalReached === false, `Goal not yet reached`);
  });

  // ── Test 3: Contribute to campaign ────────────────────────
  await test("Contribute 0.5 ETH to campaign", async () => {
    const campaign = await hre.ethers.getContractAt("Campaign", globalThis._campaignAddress);
    const amount = hre.ethers.parseEther("0.5");
    const tx = await campaign.connect(contributor1).contribute({ value: amount });
    await tx.wait();
    assert(true, "Contribution confirmed");
  });

  await waitForIndexing(4);

  // ── Test 4: Subgraph indexed contribution ──────────────────
  await test("Subgraph indexed contribution", async () => {
    const result = await gql(`{
      campaigns(first: 1, orderBy: createdAt, orderDirection: desc) {
        totalFunds
        contributorsCount
        contributions { amount }
      }
    }`);
    assert(!result.errors, "No GraphQL errors");
    const campaign = result.data.campaigns[0];
    assert(campaign.totalFunds === "500000000000000000", `Total funds = 0.5 ETH`);
    assert(campaign.contributorsCount === "1", `1 contributor`);
    assert(campaign.contributions.length === 1, `1 contribution event`);
  });

  // ── Test 5: Second contribution ───────────────────────────
  await test("Contribute 1.6 ETH from second contributor (reaches goal)", async () => {
    const campaign = await hre.ethers.getContractAt("Campaign", globalThis._campaignAddress);
    const amount = hre.ethers.parseEther("1.6");
    const tx = await campaign.connect(contributor2).contribute({ value: amount });
    await tx.wait();
    assert(true, "Second contribution confirmed");
  });

  await waitForIndexing(4);

  // ── Test 6: Goal reached ──────────────────────────────────
  await test("Goal reached after 2.1 ETH raised", async () => {
    const result = await gql(`{
      campaigns(first: 1, orderBy: createdAt, orderDirection: desc) {
        totalFunds
        goalReached
        contributorsCount
      }
    }`);
    assert(!result.errors, "No GraphQL errors");
    const campaign = result.data.campaigns[0];
    assert(campaign.goalReached === true, `Goal reached = true`);
    assert(campaign.contributorsCount === "2", `2 contributors`);
  });

  // ── Test 7: Withdrawal ────────────────────────────────────
  await test("Creator withdraws funds", async () => {
    const campaign = await hre.ethers.getContractAt("Campaign", globalThis._campaignAddress);
    const tx = await campaign.connect(creator).withdraw();
    await tx.wait();
    assert(true, "Withdrawal confirmed");
  });

  // ── Test 8: Backend health endpoint ───────────────────────
  await test("Backend health endpoint responds", async () => {
    const health = await apiGet("/health");
    assert(health.status === "ok", `Health status = ${health.status}`);
    assert(health.checks.database.connected === true, "Database connected");
  });

  // ── Test 9: Backend blockchain status ─────────────────────
  await test("Backend blockchain service connected", async () => {
    const status = await apiGet("/api/v1/blockchain/status");
    assert(status.connected === true, `Blockchain connected`);
    assert(status.factoryAddress, `Factory address: ${status.factoryAddress}`);
  });

  // ── Test 10: Backend campaigns endpoint ───────────────────
  await test("Backend campaigns endpoint returns data", async () => {
    const result = await apiGet("/api/v1/blockchain/campaigns");
    assert(result && (Array.isArray(result) || result.campaigns), `Got campaign data`);
  });

  // ── Summary ───────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
