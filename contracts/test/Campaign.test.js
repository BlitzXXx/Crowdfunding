const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Campaign", function () {
  let Campaign;
  let campaign;
  let creator;
  let contributor1;
  let contributor2;
  let contributor3;

  const GOAL = ethers.parseEther("10"); // 10 ETH
  const DURATION = 30 * 24 * 60 * 60; // 30 days
  const IPFS_HASH = "QmTest123456789";

  beforeEach(async function () {
    [creator, contributor1, contributor2, contributor3] = await ethers.getSigners();

    Campaign = await ethers.getContractFactory("Campaign");
    campaign = await Campaign.deploy(
      creator.address,
      GOAL,
      DURATION,
      IPFS_HASH
    );
  });

  describe("Deployment", function () {
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

    it("Should revert with invalid creator address", async function () {
      await expect(
        Campaign.deploy(ethers.ZeroAddress, GOAL, DURATION, IPFS_HASH)
      ).to.be.revertedWith("Invalid creator address");
    });

    it("Should revert with zero goal", async function () {
      await expect(
        Campaign.deploy(creator.address, 0, DURATION, IPFS_HASH)
      ).to.be.revertedWith("Goal must be greater than 0");
    });

    it("Should revert with zero duration", async function () {
      await expect(
        Campaign.deploy(creator.address, GOAL, 0, IPFS_HASH)
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should revert with empty IPFS hash", async function () {
      await expect(
        Campaign.deploy(creator.address, GOAL, DURATION, "")
      ).to.be.revertedWith("IPFS hash cannot be empty");
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

    it("Should revert on zero contribution", async function () {
      await expect(
        campaign.connect(contributor1).contribute({ value: 0 })
      ).to.be.revertedWith("Contribution must be greater than 0");
    });

    it("Should revert after deadline", async function () {
      await time.increase(DURATION + 1);

      await expect(
        campaign.connect(contributor1).contribute({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign has ended");
    });

    it("Should revert after goal is reached", async function () {
      await campaign.connect(contributor1).contribute({ value: GOAL });

      await expect(
        campaign.connect(contributor2).contribute({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign goal already reached");
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

    it("Should revert if non-creator tries to withdraw", async function () {
      await expect(
        campaign.connect(contributor1).withdraw()
      ).to.be.revertedWith("Only creator can call this function");
    });

    it("Should revert if goal not reached", async function () {
      const partialCampaign = await Campaign.deploy(
        creator.address,
        GOAL,
        DURATION,
        IPFS_HASH
      );

      await partialCampaign.connect(contributor1).contribute({ value: ethers.parseEther("5") });

      await expect(
        partialCampaign.connect(creator).withdraw()
      ).to.be.revertedWith("Goal not reached");
    });

    it("Should revert if funds already withdrawn", async function () {
      await campaign.connect(creator).withdraw();

      await expect(
        campaign.connect(creator).withdraw()
      ).to.be.revertedWith("Funds already withdrawn");
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
    });

    it("Should revert refund before deadline", async function () {
      const activeCampaign = await Campaign.deploy(
        creator.address,
        GOAL,
        DURATION,
        IPFS_HASH
      );
      await activeCampaign.connect(contributor1).contribute({ value: ethers.parseEther("1") });

      await expect(
        activeCampaign.connect(contributor1).refund()
      ).to.be.revertedWith("Campaign is still active");
    });

    it("Should revert refund if goal was reached", async function () {
      const successfulCampaign = await Campaign.deploy(
        creator.address,
        GOAL,
        DURATION,
        IPFS_HASH
      );
      await successfulCampaign.connect(contributor1).contribute({ value: GOAL });
      await time.increase(DURATION + 1);

      await expect(
        successfulCampaign.connect(contributor1).refund()
      ).to.be.revertedWith("Goal was reached, no refunds");
    });

    it("Should revert if no contribution to refund", async function () {
      await expect(
        campaign.connect(contributor3).refund()
      ).to.be.revertedWith("No contribution to refund");
    });

    it("Should revert double refund", async function () {
      await campaign.connect(contributor1).refund();

      await expect(
        campaign.connect(contributor1).refund()
      ).to.be.revertedWith("No contribution to refund");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await campaign.connect(contributor1).contribute({ value: ethers.parseEther("3") });
      await campaign.connect(contributor2).contribute({ value: ethers.parseEther("2") });
    });

    it("Should return correct campaign details", async function () {
      const details = await campaign.getCampaignDetails();

      expect(details._creator).to.equal(creator.address);
      expect(details._goal).to.equal(GOAL);
      expect(details._totalFunds).to.equal(ethers.parseEther("5"));
      expect(details._goalReached).to.be.false;
      expect(details._fundsWithdrawn).to.be.false;
      expect(details._ipfsHash).to.equal(IPFS_HASH);
      expect(details._contributorsCount).to.equal(2);
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

    it("Should return correct state", async function () {
      // Active
      expect(await campaign.getState()).to.equal(0);

      // Successful
      await campaign.connect(contributor3).contribute({ value: ethers.parseEther("10") });
      expect(await campaign.getState()).to.equal(1);

      // Failed
      const failedCampaign = await Campaign.deploy(
        creator.address,
        GOAL,
        DURATION,
        IPFS_HASH
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
});
