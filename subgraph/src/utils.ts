import { Address, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";

import { Campaign as CampaignEntity, User, PlatformStats } from "../generated/schema";

export const STATS_ID = "platform";

export function getOrCreateStats(): PlatformStats {
  let stats = PlatformStats.load(STATS_ID);
  if (stats == null) {
    stats = new PlatformStats(STATS_ID);
    stats.totalCampaigns = GraphBigInt.zero();
    stats.successfulCampaigns = GraphBigInt.zero();
    stats.cancelledCampaigns = GraphBigInt.zero();
    stats.totalContributionCount = GraphBigInt.zero();
    stats.totalVolume = GraphBigInt.zero();
    stats.totalWithdrawn = GraphBigInt.zero();
    stats.totalRefunded = GraphBigInt.zero();
  }
  return stats!;
}

export function getOrCreateUser(address: Address): User {
  let id = address.toHexString();
  let user = User.load(id);
  if (user == null) {
    user = new User(id);
    user.address = address;
    user.campaignsCreatedCount = GraphBigInt.zero();
    user.contributionsCount = GraphBigInt.zero();
    user.totalContributed = GraphBigInt.zero();
    user.totalRefunded = GraphBigInt.zero();
    user.createdAt = GraphBigInt.zero(); // set by first handler
  }
  return user!;
}

/**
 * Returns true if the contributor is new to the campaign.
 * Appends the address to the campaign's contributor list in that case.
 */
export function isNewContributor(campaign: CampaignEntity, contributor: Address): bool {
  let list = campaign.contributors;
  for (let i = 0; i < list.length; i++) {
    if (list[i].equals(contributor)) {
      return false;
    }
  }
  list.push(contributor);
  campaign.contributors = list;
  return true;
}
