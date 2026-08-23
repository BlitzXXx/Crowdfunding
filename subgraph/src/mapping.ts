import { BigInt as GraphBigInt, dataSource } from "@graphprotocol/graph-ts";

import {
  CampaignCreated,
} from "../generated/CrowdfundingFactory/CrowdfundingFactory";
import {
  ContributionMade,
  GoalReached,
  WithdrawalMade,
  RefundClaimed,
  CampaignCancelled,
} from "../generated/templates/Campaign/Campaign";
import { Campaign as CampaignTemplate } from "../generated/templates";
import {
  Campaign,
  Contribution,
  Withdrawal,
  Refund,
  User,
} from "../generated/schema";
import { getOrCreateStats, getOrCreateUser, isNewContributor } from "./utils";

// ============================================
// FACTORY HANDLERS
// ============================================

export function handleCampaignCreated(event: CampaignCreated): void {
  let campaignAddress = event.params.campaignAddress;
  let campaignId = campaignAddress.toHexString();
  let timestamp = event.block.timestamp;

  // Creator
  let creator = getOrCreateUser(event.params.creator);
  if (creator.createdAt.equals(GraphBigInt.zero())) {
    creator.createdAt = timestamp;
  }
  creator.campaignsCreatedCount = creator.campaignsCreatedCount.plus(GraphBigInt.fromI32(1));
  creator.save();

  // Campaign
  let campaign = new Campaign(campaignId);
  campaign.address = campaignAddress;
  campaign.creator = creator.id;
  campaign.goal = event.params.goal;
  campaign.deadline = event.params.deadline;
  campaign.ipfsHash = event.params.ipfsHash;

  campaign.totalFunds = GraphBigInt.zero();
  campaign.refundedAmount = GraphBigInt.zero();
  campaign.withdrawnAmount = GraphBigInt.zero();

  campaign.goalReached = false;
  campaign.fundsWithdrawn = false;
  campaign.cancelled = false;

  campaign.contributorsCount = GraphBigInt.zero();
  campaign.contributionsCount = GraphBigInt.zero();

  campaign.createdAt = timestamp;
  campaign.createdAtBlock = event.block.number;
  campaign.updatedAt = timestamp;
  campaign.contributors = [];

  campaign.save();

  // Platform stats
  let stats = getOrCreateStats();
  stats.totalCampaigns = stats.totalCampaigns.plus(GraphBigInt.fromI32(1));
  stats.updatedAt = timestamp;
  stats.save();

  // Start indexing the clone's events via the Campaign template
  CampaignTemplate.create(campaignAddress);}

// ============================================
// CAMPAIGN TEMPLATE HANDLERS
// ============================================

export function handleContributionMade(event: ContributionMade): void {
  let campaignId = dataSource.address().toHexString();
  let contributorAddress = event.params.contributor;
  let amount = event.params.amount;
  let timestamp = event.block.timestamp;

  let contribution = new Contribution(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  contribution.campaign = campaignId;
  contribution.contributor = contributorAddress.toHexString();
  contribution.amount = amount;
  contribution.blockNumber = event.block.number;
  contribution.blockTimestamp = timestamp;
  contribution.txHash = event.transaction.hash;
  contribution.save();

  let campaign = Campaign.load(campaignId);
  if (campaign == null) return;

  if (isNewContributor(campaign, contributorAddress)) {
    campaign.contributorsCount = campaign.contributorsCount.plus(GraphBigInt.fromI32(1));
  }

  campaign.contributionsCount = campaign.contributionsCount.plus(GraphBigInt.fromI32(1));
  campaign.totalFunds = campaign.totalFunds.plus(amount);
  campaign.updatedAt = timestamp;
  campaign.save();

  let contributor = User.load(contributorAddress.toHexString());
  if (contributor != null) {
    if (contributor.createdAt.equals(GraphBigInt.zero())) {
      contributor.createdAt = timestamp;
    }
    contributor.contributionsCount = contributor.contributionsCount.plus(GraphBigInt.fromI32(1));
    contributor.totalContributed = contributor.totalContributed.plus(amount);
    contributor.save();
  }

  let stats = getOrCreateStats();
  stats.totalContributionCount = stats.totalContributionCount.plus(GraphBigInt.fromI32(1));
  stats.totalVolume = stats.totalVolume.plus(amount);
  stats.updatedAt = timestamp;
  stats.save();
}

export function handleGoalReached(event: GoalReached): void {
  let campaignId = dataSource.address().toHexString();
  let timestamp = event.block.timestamp;

  let campaign = Campaign.load(campaignId);
  if (campaign == null) return;

  campaign.goalReached = true;
  campaign.totalFunds = event.params.totalAmount;
  campaign.updatedAt = timestamp;
  campaign.save();

  let stats = getOrCreateStats();
  stats.successfulCampaigns = stats.successfulCampaigns.plus(GraphBigInt.fromI32(1));
  stats.updatedAt = timestamp;
  stats.save();
}

export function handleWithdrawalMade(event: WithdrawalMade): void {
  let campaignId = dataSource.address().toHexString();
  let amount = event.params.amount;
  let timestamp = event.block.timestamp;

  let withdrawal = new Withdrawal(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  withdrawal.campaign = campaignId;
  withdrawal.amount = amount;
  withdrawal.blockNumber = event.block.number;
  withdrawal.blockTimestamp = timestamp;
  withdrawal.txHash = event.transaction.hash;
  withdrawal.save();

  let campaign = Campaign.load(campaignId);
  if (campaign == null) return;

  campaign.fundsWithdrawn = true;
  campaign.withdrawnAmount = campaign.withdrawnAmount.plus(amount);
  campaign.updatedAt = timestamp;
  campaign.save();

  let stats = getOrCreateStats();
  stats.totalWithdrawn = stats.totalWithdrawn.plus(amount);
  stats.updatedAt = timestamp;
  stats.save();
}

export function handleRefundClaimed(event: RefundClaimed): void {
  let campaignId = dataSource.address().toHexString();
  let contributorAddress = event.params.contributor;
  let amount = event.params.amount;
  let timestamp = event.block.timestamp;

  let refund = new Refund(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  refund.campaign = campaignId;
  refund.contributor = contributorAddress.toHexString();
  refund.amount = amount;
  refund.blockNumber = event.block.number;
  refund.blockTimestamp = timestamp;
  refund.txHash = event.transaction.hash;
  refund.save();

  let campaign = Campaign.load(campaignId);
  if (campaign != null) {
    campaign.refundedAmount = campaign.refundedAmount.plus(amount);
    campaign.updatedAt = timestamp;
    campaign.save();
  }

  let user = User.load(contributorAddress.toHexString());
  if (user != null) {
    user.totalRefunded = user.totalRefunded.plus(amount);
    user.save();
  }

  let stats = getOrCreateStats();
  stats.totalRefunded = stats.totalRefunded.plus(amount);
  stats.updatedAt = timestamp;
  stats.save();
}

export function handleCampaignCancelled(event: CampaignCancelled): void {
  let campaignId = dataSource.address().toHexString();
  let timestamp = event.block.timestamp;

  let campaign = Campaign.load(campaignId);
  if (campaign == null) return;

  campaign.cancelled = true;
  campaign.updatedAt = timestamp;
  campaign.save();

  let stats = getOrCreateStats();
  stats.cancelledCampaigns = stats.cancelledCampaigns.plus(GraphBigInt.fromI32(1));
  stats.updatedAt = timestamp;
  stats.save();
}
