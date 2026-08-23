const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Campaign", function () {
  let Campaign;
  let campaignInterface;
  let factory;
  let campaign;
  let creator;
  let contributor1;
  let contributor2;
  let contributor3;

  const GOAL = ethers.parseEther("10"); // 10 ETH
  const DURATION = 30 * 24 * 60 * 60; // 30 days
  const IPFS_HASH = "QmTest123456789";

  /**
   * Creates a campaign through the factory and returns it as an attached contract.
   * Uses staticCall to grab the deterministic clone address without parsing logs.
   */
  async function createCampaignViaFactory(signer, goal = GOAL, duration = DURATION, hash = IPFS_HASH) {
    const address = await factory.connect(signer).createCampaign.staticCall(goal, duration, hash);
    await factory.connect(signer).createCampaign(goal, duration, hash);
    return Campaign.attach(address);
  }

  before(async function () {
    Campaign = await ethers.getContractFactory("Campaign");
    campaignInterface = Campaign.interface;
  });

  beforeEach(async function () {
    [creator, contributor1, contributor2, contributor3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("CrowdfundingFactory");
    factory = await Factory.deploy();

    campaign = await createCampaignViaFactory(creator);
  });

  describe("Initialization", function () {
    it("Should set the correct creator", async function () {
      expect(await campaign.creator()).to.equal(creator.address);
    });

    it("Should set the correct goal", async function () {
      expect(await campaign.goal()).to.equal(GOAL);
    });

    it("Should set the correct deadline", async function () {
      const deadline = await campaign.deadline();
      const currentTime = await time.latest();
      expect(deadline).to.be.closeTo(currentTime + DURATION, 5);
    });

    it("Should set the correct IPFS hash", async function () {
      expect(await campaign.ipfsHash()).to.equal(IPFS_HASH);
    });

    it("Should initialize with zero funds", async function () {
      expect(await campaign.totalFunds()).to.equal(0);
    });

    it("Should not be goal reached initially", async function () {
      expect(await campaign.goalReached()).to.be.false;
    });

    it("Should not be cancelled initially", async function () {
      expect(await campaign.cancelled()).to.be.false;
    });

    it("Should prevent re-initialization", async function () {
      await expect(
        campaign.initialize(creator.address, GOAL, DURATION, IPFS_HASH)
      ).to.be.revertedWithCustomError({ interface: campaignInterface }, "InvalidInitialization");
    });

    it("Should reject invalid params during creation", async function () {
      const cases = [
        [0, DURATION, IPFS_HASH],
        [GOAL, 0, IPFS_HASH],
        [GOAL, DURATION, ""],
      ];

      for (const [goalArg, durationArg, hashArg] of cases) {
        await expect(
          factory.createCampaign.staticCall(goalArg, durationArg, hashArg)
        ).to.be.reverted;
      }
    });
  });

  describe("Contributions", function () {
    it("Should accept contributions", async function () {
      const amount = ethers.parseEther("1");

      await expect(campaign.connect(contributor1).contribute({ value: amount }))
        .to.emit(campaign, "ContributionMade")
        .withArgs(contributor1.address, amount);

      expect(await campaign.totalFunds()).to.equal(amount);
      expect(await campaign.contributions(contributor1.address)).to.equal(amount);
    });

    it("Should track multiple contributions from same address", async function () {
      const amount1 = ethers.parseEther("1");
      const amount2 = ethers.parseEther("2");

      await campaign.connect(contributor1).contribute({ value: amount1 });
      await campaign.connect(contributor1).contribute({ value: amount2 });

      expect(await campaign.contributions(contributor1.address)).to.equal(amount1 + amount2);
      expect(await campaign.totalFunds()).to.equal(amount1 + amount2);
    });

    it("Should add contributor to list on first contribution", async function () {
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("1") });

      const contributors = await campaign.getContributors();
      expect(contributors).to.include(contributor1.address);
      expect(await campaign.isContributor(contributor1.address)).to.be.true;
    });

    it("Should not duplicate contributor in list", async function () {
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("1") });
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("1") });

      const contributors = await campaign.getContributors();
      expect(contributors.length).to.equal(1);
    });

    it("Should emit GoalReached event when goal is met", async function () {
      await expect(campaign.connect(contributor1).contribute({ value: GOAL }))
        .to.emit(campaign, "GoalReached")
        .withArgs(GOAL);

      expect(await campaign.goalReached()).to.be.true;
    });

    it("Should accept over-contribution beyond goal", async function () {
      const amount = ethers.parseEther("12");
      await campaign.connect(contributor1).contribute({ value: amount });

      expect(await campaign.totalFunds()).to.equal(amount);
      expect(await campaign.goalReached()).to.be.true;
    });

    it("Should revert on zero contribution", async function () {
      await expect(
        campaign.connect(contributor1).contribute({ value: 0 })
      ).to.be.revertedWithCustomError(campaign, "ZeroValue");
    });

    it("Should revert after deadline", async function () {
      await time.increase(DURATION + 1);

      await expect(
        campaign.connect(contributor1).contribute({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaign, "CampaignEnded");
    });

    it("Should revert after goal is reached", async function () {
      await campaign.connect(contributor1).contribute({ value: GOAL });

      await expect(
        campaign.connect(contributor2).contribute({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaign, "GoalAlreadyReached");
    });

    it("Should revert after campaign is cancelled", async function () {
      await campaign.connect(creator).cancel();

      await expect(
        campaign.connect(contributor1).contribute({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaign, "CampaignCancelledError");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Contribute enough to reach goal
      await campaign.connect(contributor1).contribute({ value: GOAL });
    });

    it("Should allow creator to withdraw after goal reached", async function () {
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);

      const tx = await campaign.connect(creator).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        .to.emit(campaign, "WithdrawalMade")
        .withArgs(creator.address, GOAL);

      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore + GOAL - gasUsed);
      expect(await campaign.fundsWithdrawn()).to.be.true;
    });

    it("Should include over-contributions in withdrawal", async function () {
      // Fresh campaign; single contribution exceeding the goal
      const freshCampaign = await createCampaignViaFactory(
        creator,
        GOAL,
        DURATION,
        "QmOverGoal"
      );

      const amount = GOAL + ethers.parseEther("3");
      await freshCampaign.connect(contributor2).contribute({ value: amount });

      const tx = await freshCampaign.connect(creator).withdraw();
      await expect(tx)
        .to.emit(freshCampaign, "WithdrawalMade")
        .withArgs(creator.address, amount);
    });

    it("Should revert if non-creator tries to withdraw", async function () {
      await expect(
        campaign.connect(contributor1).withdraw()
      ).to.be.revertedWithCustomError(campaign, "NotCreator");
    });

    it("Should revert if goal not reached", async function () {
      const partialCampaign = await createCampaignViaFactory(
        creator,
        GOAL,
        DURATION,
        "QmPartial"
      );

      await partialCampaign.connect(contributor1).contribute({ value: ethers.parseEther("5") });

      await expect(
        partialCampaign.connect(creator).withdraw()
      ).to.be.revertedWithCustomError(partialCampaign, "GoalNotReached");
    });

    it("Should revert if funds already withdrawn", async function () {
      await campaign.connect(creator).withdraw();

      await expect(
        campaign.connect(creator).withdraw()
      ).to.be.revertedWithCustomError(campaign, "AlreadyWithdrawn");
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
      // Contribute but don't reach goal
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("3") });
      await campaign.connect(contributor2).contribute({ value: ethers.parseEther("2") });

      // Move past deadline
      await time.increase(DURATION + 1);
    });

    it("Should allow refund after deadline if goal not reached", async function () {
      const balanceBefore = await ethers.provider.getBalance(contributor1.address);
      const contributionAmount = ethers.parseEther("3");

      const tx = await campaign.connect(contributor1).refund();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        .to.emit(campaign, "RefundClaimed")
        .withArgs(contributor1.address, contributionAmount);

      const balanceAfter = await ethers.provider.getBalance(contributor1.address);
      expect(balanceAfter).to.equal(balanceBefore + contributionAmount - gasUsed);
      expect(await campaign.contributions(contributor1.address)).to.equal(0);
      expect(await campaign.totalRefunded()).to.equal(contributionAmount);
    });

    it("Should revert refund before deadline", async function () {
      const activeCampaign = await createCampaignViaFactory(
        creator,
        GOAL,
        DURATION,
        "QmActive"
      );
      await activeCampaign.connect(contributor1).contribute({ value: ethers.parseEther("1") });

      await expect(
        activeCampaign.connect(contributor1).refund()
      ).to.be.revertedWithCustomError(activeCampaign, "RefundsLocked");
    });

    it("Should revert refund if goal was reached", async function () {
      const successfulCampaign = await createCampaignViaFactory(
        creator,
        GOAL,
        DURATION,
        "QmSuccessful"
      );
      await successfulCampaign.connect(contributor1).contribute({ value: GOAL });
      await time.increase(DURATION + 1);

      await expect(
        successfulCampaign.connect(contributor1).refund()
      ).to.be.revertedWithCustomError(successfulCampaign, "RefundsLocked");
    });

    it("Should revert if no contribution to refund", async function () {
      await expect(
        campaign.connect(contributor3).refund()
      ).to.be.revertedWithCustomError(campaign, "NothingToRefund");
    });

    it("Should revert double refund", async function () {
      await campaign.connect(contributor1).refund();

      await expect(
        campaign.connect(contributor1).refund()
      ).to.be.revertedWithCustomError(campaign, "NothingToRefund");
    });
  });

  describe("Cancellation", function () {
    beforeEach(async function () {
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("3") });
      await campaign.connect(contributor2).contribute({ value: ethers.parseEther("2") });
    });

    it("Should allow creator to cancel active campaign", async function () {
      await expect(campaign.connect(creator).cancel())
        .to.emit(campaign, "CampaignCancelled")
        .withArgs(creator.address);

      expect(await campaign.cancelled()).to.be.true;
      expect(await campaign.getState()).to.equal(3); // Cancelled
    });

    it("Should allow immediate refunds after cancellation", async function () {
      await campaign.connect(creator).cancel();

      const balanceBefore = await ethers.provider.getBalance(contributor1.address);
      const contributionAmount = ethers.parseEther("3");

      const tx = await campaign.connect(contributor1).refund();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        .to.emit(campaign, "RefundClaimed")
        .withArgs(contributor1.address, contributionAmount);

      const balanceAfter = await ethers.provider.getBalance(contributor1.address);
      expect(balanceAfter).to.equal(balanceBefore + contributionAmount - gasUsed);
    });

    it("Should revert if non-creator tries to cancel", async function () {
      await expect(
        campaign.connect(contributor1).cancel()
      ).to.be.revertedWithCustomError(campaign, "NotCreator");
    });

    it("Should revert double cancellation", async function () {
      await campaign.connect(creator).cancel();

      await expect(
        campaign.connect(creator).cancel()
      ).to.be.revertedWithCustomError(campaign, "CampaignCancelledError");
    });

    it("Should revert cancellation after goal is reached", async function () {
      await campaign.connect(contributor3).contribute({ value: GOAL });

      await expect(
        campaign.connect(creator).cancel()
      ).to.be.revertedWithCustomError(campaign, "GoalAlreadyReached");
    });

    it("Should revert cancellation after deadline", async function () {
      await time.increase(DURATION + 1);

      await expect(
        campaign.connect(creator).cancel()
      ).to.be.revertedWithCustomError(campaign, "CampaignEnded");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("3") });
      await campaign.connect(contributor2).contribute({ value: ethers.parseEther("2") });
    });

    it("Should return correct campaign details", async function () {
      const details = await campaign.getCampaignDetails();

      expect(details.creator_).to.equal(creator.address);
      expect(details.goal_).to.equal(GOAL);
      expect(details.totalFunds_).to.equal(ethers.parseEther("5"));
      expect(details.goalReached_).to.be.false;
      expect(details.fundsWithdrawn_).to.be.false;
      expect(details.ipfsHash_).to.equal(IPFS_HASH);
      expect(details.contributorsCount_).to.equal(2n);
    });

    it("Should return correct contributors list", async function () {
      const contributors = await campaign.getContributors();

      expect(contributors.length).to.equal(2);
      expect(contributors).to.include(contributor1.address);
      expect(contributors).to.include(contributor2.address);
    });

    it("Should return correct contribution amount", async function () {
      expect(await campaign.getContribution(contributor1.address)).to.equal(ethers.parseEther("3"));
      expect(await campaign.getContribution(contributor2.address)).to.equal(ethers.parseEther("2"));
    });

    it("Should return correct active status", async function () {
      expect(await campaign.isActive()).to.be.true;

      await time.increase(DURATION + 1);
      expect(await campaign.isActive()).to.be.false;
    });

    it("Should return false for isActive when cancelled", async function () {
      await campaign.connect(creator).cancel();
      expect(await campaign.isActive()).to.be.false;
    });

    it("Should return correct state", async function () {
      // Active
      expect(await campaign.getState()).to.equal(0);

      // Successful
      await campaign.connect(contributor3).contribute({ value: ethers.parseEther("10") });
      expect(await campaign.getState()).to.equal(1);

      // Failed
      const failedCampaign = await createCampaignViaFactory(
        creator,
        GOAL,
        DURATION,
        "QmFailed"
      );
      await failedCampaign.connect(contributor1).contribute({ value: ethers.parseEther("5") });
      await time.increase(DURATION + 1);
      expect(await failedCampaign.getState()).to.equal(2);
    });

    it("Should return correct remaining time", async function () {
      const remaining = await campaign.getRemainingTime();
      expect(remaining).to.be.closeTo(DURATION, 5);

      await time.increase(DURATION + 1);
      expect(await campaign.getRemainingTime()).to.equal(0);
    });

    it("Should return correct progress", async function () {
      expect(await campaign.getProgress()).to.equal(50); // 5 ETH / 10 ETH = 50%

      await campaign.connect(contributor3).contribute({ value: ethers.parseEther("2.5") });
      expect(await campaign.getProgress()).to.equal(75); // 7.5 ETH / 10 ETH = 75%
    });
  });

  describe("Security", function () {
    it("Should not allow direct ETH transfers to force contributions", async function () {
      await expect(
        contributor1.sendTransaction({ to: await campaign.getAddress(), value: ethers.parseEther("1") })
      ).to.be.rejected;
    });

    it("Should track totalRefunded accurately across multiple refunds", async function () {
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("3") });
      await campaign.connect(contributor2).contribute({ value: ethers.parseEther("2") });
      await time.increase(DURATION + 1);

      await campaign.connect(contributor1).refund();
      await campaign.connect(contributor2).refund();

      expect(await campaign.totalRefunded()).to.equal(ethers.parseEther("5"));
    });
  });
});
