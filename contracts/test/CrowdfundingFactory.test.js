const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdfundingFactory", function () {
  let Factory;
  let factory;
  let creator1;
  let creator2;
  let contributor;

  const GOAL = ethers.parseEther("10");
  const DURATION = 30 * 24 * 60 * 60; // 30 days
  const IPFS_HASH = "QmTest123456789";

  async function createCampaign(signer, goal = GOAL, duration = DURATION, hash = IPFS_HASH) {
    const address = await factory.connect(signer).createCampaign.staticCall(goal, duration, hash);
    await factory.connect(signer).createCampaign(goal, duration, hash);
    return address;
  }

  beforeEach(async function () {
    [creator1, creator2, contributor] = await ethers.getSigners();

    Factory = await ethers.getContractFactory("CrowdfundingFactory");
    factory = await Factory.deploy();
  });

  describe("Deployment", function () {
    it("Should deploy a campaign implementation", async function () {
      const implementation = await factory.campaignImplementation();
      expect(implementation).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Campaign Creation", function () {
    it("Should create a new campaign", async function () {
      const tx = await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      const receipt = await tx.wait();

      // Find CampaignCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const parsedEvent = factory.interface.parseLog(event);
      expect(parsedEvent.args.creator).to.equal(creator1.address);
      expect(parsedEvent.args.goal).to.equal(GOAL);
      expect(parsedEvent.args.ipfsHash).to.equal(IPFS_HASH);
    });

    it("Should deploy campaigns as deterministic minimal proxies", async function () {
      const predicted = await factory.predictNextCampaignAddress();
      const actual = await createCampaign(creator1);

      expect(actual).to.equal(predicted);
    });

    it("Should predict subsequent campaign addresses correctly", async function () {
      const predicted1 = await factory.predictNextCampaignAddress();
      const campaign1 = await createCampaign(creator1);

      expect(campaign1).to.equal(predicted1);

      const predicted2 = await factory.predictNextCampaignAddress();
      const campaign2 = await createCampaign(creator1);

      expect(campaign2).to.equal(predicted2);
      expect(campaign1).to.not.equal(campaign2);
    });

    it("Should deploy cheap clones (EIP-1167 runtime size)", async function () {
      const campaignAddress = await createCampaign(creator1);
      const code = await ethers.provider.getCode(campaignAddress);

      // EIP-1167 minimal proxy runtime bytecode is 45 bytes
      expect(code.length).to.equal(2 + 45 * 2);
    });

    it("Should increment campaign count", async function () {
      expect(await factory.getCampaignCount()).to.equal(0);

      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      expect(await factory.getCampaignCount()).to.equal(1);

      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      expect(await factory.getCampaignCount()).to.equal(2);
    });

    it("Should track campaigns by creator", async function () {
      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      await factory.connect(creator2).createCampaign(GOAL, DURATION, IPFS_HASH);

      const creator1Campaigns = await factory.getCampaignsByCreator(creator1.address);
      const creator2Campaigns = await factory.getCampaignsByCreator(creator2.address);

      expect(creator1Campaigns.length).to.equal(2);
      expect(creator2Campaigns.length).to.equal(1);
    });

    it("Should mark campaign as valid", async function () {
      const campaignAddress = await createCampaign(creator1);

      expect(await factory.isCampaign(campaignAddress)).to.be.true;
      expect(await factory.verifyCampaign(campaignAddress)).to.be.true;
    });

    it("Should revert with zero goal", async function () {
      await expect(
        factory.connect(creator1).createCampaign(0, DURATION, IPFS_HASH)
      ).to.be.revertedWithCustomError(factory, "InvalidGoal");
    });

    it("Should revert with zero duration", async function () {
      await expect(
        factory.connect(creator1).createCampaign(GOAL, 0, IPFS_HASH)
      ).to.be.revertedWithCustomError(factory, "InvalidDuration");
    });

    it("Should revert with duration too long", async function () {
      const tooLongDuration = 366 * 24 * 60 * 60; // 366 days

      await expect(
        factory.connect(creator1).createCampaign(GOAL, tooLongDuration, IPFS_HASH)
      ).to.be.revertedWithCustomError(factory, "DurationTooLong");
    });

    it("Should revert with empty IPFS hash", async function () {
      await expect(
        factory.connect(creator1).createCampaign(GOAL, DURATION, "")
      ).to.be.revertedWithCustomError(factory, "EmptyIPFSHash");
    });

    it("Should deploy independent campaign contracts", async function () {
      const campaign1Address = await createCampaign(creator1);
      const campaign2Address = await createCampaign(
        creator1,
        ethers.parseEther("20"),
        DURATION,
        "QmDifferentHash"
      );

      expect(campaign1Address).to.not.equal(campaign2Address);

      // Verify campaigns are independent
      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign1 = Campaign.attach(campaign1Address);
      const campaign2 = Campaign.attach(campaign2Address);

      expect(await campaign1.goal()).to.equal(GOAL);
      expect(await campaign2.goal()).to.equal(ethers.parseEther("20"));
    });

    it("Should share a single implementation across all campaigns", async function () {
      const implementation = await factory.campaignImplementation();

      const campaign1Address = await createCampaign(creator1);
      const campaign2Address = await createCampaign(creator2);

      // EIP-1167 proxies hardcode the implementation address in bytecode
      const code1 = await ethers.provider.getCode(campaign1Address);
      const code2 = await ethers.provider.getCode(campaign2Address);

      const implSlot = implementation.toLowerCase().slice(2).padStart(40, "0");
      expect(code1.toLowerCase()).to.contain(implSlot);
      expect(code2.toLowerCase()).to.contain(implSlot);
    });
  });

  describe("Querying Campaigns", function () {
    beforeEach(async function () {
      // Create multiple campaigns
      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      await factory.connect(creator2).createCampaign(GOAL, DURATION, IPFS_HASH);
      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
    });

    it("Should return all campaigns", async function () {
      const allCampaigns = await factory.getAllCampaigns();
      expect(allCampaigns.length).to.equal(3);
    });

    it("Should return campaigns by creator", async function () {
      const creator1Campaigns = await factory.getCampaignsByCreator(creator1.address);
      const creator2Campaigns = await factory.getCampaignsByCreator(creator2.address);

      expect(creator1Campaigns.length).to.equal(2);
      expect(creator2Campaigns.length).to.equal(1);
    });

    it("Should return correct campaign count", async function () {
      expect(await factory.getCampaignCount()).to.equal(3);
    });

    it("Should return paginated campaigns", async function () {
      const page1 = await factory.getCampaignsPaginated(0, 2);
      const page2 = await factory.getCampaignsPaginated(2, 2);

      expect(page1.length).to.equal(2);
      expect(page2.length).to.equal(1);
    });

    it("Should handle pagination edge cases", async function () {
      // Start beyond array length
      await expect(
        factory.getCampaignsPaginated(10, 5)
      ).to.be.revertedWithCustomError(factory, "StartIndexOutOfBounds");

      // Limit beyond array length
      const result = await factory.getCampaignsPaginated(2, 10);
      expect(result.length).to.equal(1); // Only 1 item left from index 2
    });

    it("Should return campaign details in bulk", async function () {
      const allCampaigns = await factory.getAllCampaigns();

      // Low-level call: avoids ethers v6 decoding quirk with array args + named outputs
      const data = factory.interface.encodeFunctionData("getCampaignDetailsBulk", [allCampaigns]);
      const result = await ethers.provider.call({
        to: await factory.getAddress(),
        data,
      });
      const bulkDetails = factory.interface.decodeFunctionResult("getCampaignDetailsBulk", result);

      expect(bulkDetails.creators.length).to.equal(3);
      expect(bulkDetails.goals.length).to.equal(3);
      expect(bulkDetails.creators[0]).to.equal(creator1.address);
      expect(bulkDetails.creators[1]).to.equal(creator2.address);
      expect(bulkDetails.goals[0]).to.equal(GOAL);
    });

    it("Should return zeroed details for invalid campaign addresses", async function () {
      const data = factory.interface.encodeFunctionData("getCampaignDetailsBulk", [[creator1.address]]);
      const result = await ethers.provider.call({
        to: await factory.getAddress(),
        data,
      });
      const bulkDetails = factory.interface.decodeFunctionResult("getCampaignDetailsBulk", result);

      expect(bulkDetails.creators[0]).to.equal(ethers.ZeroAddress);
      expect(bulkDetails.goals[0]).to.equal(0);
    });
  });

  describe("Active Campaigns", function () {
    it("Should return only active campaigns", async function () {
      const campaign1Address = await createCampaign(
        creator1,
        ethers.parseEther("1"),
        DURATION,
        IPFS_HASH
      );

      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);

      // Contribute to first campaign to reach goal
      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign1 = Campaign.attach(campaign1Address);
      await campaign1.connect(contributor).contribute({ value: ethers.parseEther("1") });

      // Get active campaigns
      const activeCampaigns = await factory.getActiveCampaigns();

      // Should only return the second campaign (first reached goal)
      expect(activeCampaigns.length).to.equal(1);
      expect(activeCampaigns[0]).to.not.equal(campaign1Address);
    });

    it("Should exclude cancelled campaigns from active list", async function () {
      const campaignAddress = await createCampaign(
        creator1,
        GOAL,
        DURATION,
        IPFS_HASH
      );

      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign = Campaign.attach(campaignAddress);
      await campaign.connect(creator1).cancel();

      const activeCampaigns = await factory.getActiveCampaigns();
      expect(activeCampaigns.length).to.equal(0);
    });

    it("Should return empty array if no active campaigns", async function () {
      const campaignAddress = await createCampaign(
        creator1,
        ethers.parseEther("1"),
        DURATION,
        IPFS_HASH
      );

      // Reach goal
      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign = Campaign.attach(campaignAddress);
      await campaign.connect(contributor).contribute({ value: ethers.parseEther("1") });

      const activeCampaigns = await factory.getActiveCampaigns();
      expect(activeCampaigns.length).to.equal(0);
    });
  });

  describe("Campaign Verification", function () {
    it("Should verify valid campaigns", async function () {
      const campaignAddress = await createCampaign(creator1);
      expect(await factory.verifyCampaign(campaignAddress)).to.be.true;
    });

    it("Should not verify invalid addresses", async function () {
      expect(await factory.verifyCampaign(creator1.address)).to.be.false;
      expect(await factory.verifyCampaign(ethers.ZeroAddress)).to.be.false;
    });
  });

  describe("Integration Tests", function () {
    it("Should allow full campaign workflow through factory", async function () {
      const campaignAddress = await createCampaign(
        creator1,
        ethers.parseEther("5"),
        DURATION,
        IPFS_HASH
      );

      // Interact with campaign
      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign = Campaign.attach(campaignAddress);

      // Contribute
      await campaign.connect(contributor).contribute({ value: ethers.parseEther("5") });

      // Verify campaign state
      const details = await campaign.getCampaignDetails();
      expect(details.totalFunds_).to.equal(ethers.parseEther("5"));
      expect(details.goalReached_).to.be.true;

      // Creator withdraws
      await campaign.connect(creator1).withdraw();
      expect(await campaign.fundsWithdrawn()).to.be.true;
    });

    it("Should support full cancel-refund workflow through factory", async function () {
      const campaignAddress = await createCampaign(
        creator1,
        ethers.parseEther("5"),
        DURATION,
        IPFS_HASH
      );

      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign = Campaign.attach(campaignAddress);

      await campaign.connect(contributor).contribute({ value: ethers.parseEther("2") });

      // Creator cancels, contributor refunds
      await campaign.connect(creator1).cancel();
      await campaign.connect(contributor).refund();

      expect(await campaign.totalRefunded()).to.equal(ethers.parseEther("2"));
      expect(await ethers.provider.getBalance(campaignAddress)).to.equal(0);
    });
  });
});
