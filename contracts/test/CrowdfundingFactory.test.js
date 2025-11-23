const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdfundingFactory", function () {
  let CrowdfundingFactory;
  let factory;
  let creator1;
  let creator2;
  let contributor;

  const GOAL = ethers.parseEther("10");
  const DURATION = 30 * 24 * 60 * 60; // 30 days
  const IPFS_HASH = "QmTest123456789";

  beforeEach(async function () {
    [creator1, creator2, contributor] = await ethers.getSigners();

    CrowdfundingFactory = await ethers.getContractFactory("CrowdfundingFactory");
    factory = await CrowdfundingFactory.deploy();
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
      const tx = await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event);
      const campaignAddress = parsedEvent.args.campaignAddress;

      expect(await factory.isCampaign(campaignAddress)).to.be.true;
      expect(await factory.verifyCampaign(campaignAddress)).to.be.true;
    });

    it("Should revert with zero goal", async function () {
      await expect(
        factory.connect(creator1).createCampaign(0, DURATION, IPFS_HASH)
      ).to.be.revertedWith("Goal must be greater than 0");
    });

    it("Should revert with zero duration", async function () {
      await expect(
        factory.connect(creator1).createCampaign(GOAL, 0, IPFS_HASH)
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should revert with duration too long", async function () {
      const tooLongDuration = 366 * 24 * 60 * 60; // 366 days

      await expect(
        factory.connect(creator1).createCampaign(GOAL, tooLongDuration, IPFS_HASH)
      ).to.be.revertedWith("Duration too long (max 365 days)");
    });

    it("Should revert with empty IPFS hash", async function () {
      await expect(
        factory.connect(creator1).createCampaign(GOAL, DURATION, "")
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Should deploy independent campaign contracts", async function () {
      const tx1 = await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      const receipt1 = await tx1.wait();

      const tx2 = await factory.connect(creator1).createCampaign(
        ethers.parseEther("20"),
        DURATION,
        "QmDifferentHash"
      );
      const receipt2 = await tx2.wait();

      const event1 = receipt1.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      const event2 = receipt2.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      const campaign1Address = factory.interface.parseLog(event1).args.campaignAddress;
      const campaign2Address = factory.interface.parseLog(event2).args.campaignAddress;

      expect(campaign1Address).to.not.equal(campaign2Address);

      // Verify campaigns are independent
      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign1 = Campaign.attach(campaign1Address);
      const campaign2 = Campaign.attach(campaign2Address);

      expect(await campaign1.goal()).to.equal(GOAL);
      expect(await campaign2.goal()).to.equal(ethers.parseEther("20"));
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
      ).to.be.revertedWith("Start index out of bounds");

      // Limit beyond array length
      const result = await factory.getCampaignsPaginated(2, 10);
      expect(result.length).to.equal(1); // Only 1 item left from index 2
    });

    it("Should return campaign details in bulk", async function () {
      const allCampaigns = await factory.getAllCampaigns();

      const bulkDetails = await factory.getCampaignDetailsBulk(allCampaigns);

      expect(bulkDetails.creators.length).to.equal(3);
      expect(bulkDetails.goals.length).to.equal(3);
      expect(bulkDetails.creators[0]).to.equal(creator1.address);
      expect(bulkDetails.creators[1]).to.equal(creator2.address);
      expect(bulkDetails.goals[0]).to.equal(GOAL);
    });
  });

  describe("Active Campaigns", function () {
    it("Should return only active campaigns", async function () {
      // Create campaigns
      const tx1 = await factory.connect(creator1).createCampaign(
        ethers.parseEther("1"),
        DURATION,
        IPFS_HASH
      );
      const receipt1 = await tx1.wait();

      await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);

      // Get campaign address from event
      const event = receipt1.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      const campaignAddress = factory.interface.parseLog(event).args.campaignAddress;

      // Contribute to first campaign to reach goal
      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign1 = Campaign.attach(campaignAddress);
      await campaign1.connect(contributor).contribute({ value: ethers.parseEther("1") });

      // Get active campaigns
      const activeCampaigns = await factory.getActiveCampaigns();

      // Should only return the second campaign (first reached goal)
      expect(activeCampaigns.length).to.equal(1);
      expect(activeCampaigns[0]).to.not.equal(campaignAddress);
    });

    it("Should return empty array if no active campaigns", async function () {
      const tx = await factory.connect(creator1).createCampaign(
        ethers.parseEther("1"),
        DURATION,
        IPFS_HASH
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      const campaignAddress = factory.interface.parseLog(event).args.campaignAddress;

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
      const tx = await factory.connect(creator1).createCampaign(GOAL, DURATION, IPFS_HASH);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      const campaignAddress = factory.interface.parseLog(event).args.campaignAddress;

      expect(await factory.verifyCampaign(campaignAddress)).to.be.true;
    });

    it("Should not verify invalid addresses", async function () {
      expect(await factory.verifyCampaign(creator1.address)).to.be.false;
      expect(await factory.verifyCampaign(ethers.ZeroAddress)).to.be.false;
    });
  });

  describe("Integration Tests", function () {
    it("Should allow full campaign workflow through factory", async function () {
      // Create campaign
      const tx = await factory.connect(creator1).createCampaign(
        ethers.parseEther("5"),
        DURATION,
        IPFS_HASH
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return factory.interface.parseLog(log).name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      const campaignAddress = factory.interface.parseLog(event).args.campaignAddress;

      // Interact with campaign
      const Campaign = await ethers.getContractFactory("Campaign");
      const campaign = Campaign.attach(campaignAddress);

      // Contribute
      await campaign.connect(contributor).contribute({ value: ethers.parseEther("5") });

      // Verify campaign state
      const details = await campaign.getCampaignDetails();
      expect(details._totalFunds).to.equal(ethers.parseEther("5"));
      expect(details._goalReached).to.be.true;

      // Creator withdraws
      await campaign.connect(creator1).withdraw();
      expect(await campaign.fundsWithdrawn()).to.be.true;
    });
  });
});
