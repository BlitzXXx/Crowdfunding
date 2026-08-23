// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import "./Campaign.sol";

/**
 * @title CrowdfundingFactory
 * @dev Factory contract for creating and tracking Campaign contracts.
 * @notice Deploys campaigns as EIP-1167 minimal proxies (deterministic via CREATE2)
 *         against a single shared implementation, cutting per-campaign deployment
 *         gas cost by ~80% compared to full contract deployments.
 */
contract CrowdfundingFactory {
    using Clones for address;

    // ============================================
    // CUSTOM ERRORS
    // ============================================

    error InvalidGoal();
    error InvalidDuration();
    error DurationTooLong();
    error EmptyIPFSHash();
    error StartIndexOutOfBounds();

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Shared Campaign implementation all clones point to
    address public immutable campaignImplementation;

    address[] public campaigns;                              // All deployed campaigns
    mapping(address => address[]) public campaignsByCreator; // Campaigns by creator
    mapping(address => bool) public isCampaign;              // Quick lookup for valid campaigns

    uint256 private constant MAX_DURATION = 365 days;

    // ============================================
    // EVENTS
    // ============================================

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        uint256 goal,
        uint256 deadline,
        string ipfsHash
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        campaignImplementation = address(new Campaign());
    }

    // ============================================
    // EXTERNAL FUNCTIONS
    // ============================================

    /**
     * @dev Create a new crowdfunding campaign as a deterministic minimal proxy
     * @param goal Funding goal in wei
     * @param duration Campaign duration in seconds
     * @param ipfsHash IPFS hash containing campaign metadata
     * @return The address of the newly created campaign
     */
    function createCampaign(
        uint256 goal,
        uint256 duration,
        string calldata ipfsHash
    ) external returns (address) {
        if (goal == 0) revert InvalidGoal();
        if (duration == 0) revert InvalidDuration();
        if (duration > MAX_DURATION) revert DurationTooLong();
        if (bytes(ipfsHash).length == 0) revert EmptyIPFSHash();

        // Deterministic salt derived from the current campaign index
        bytes32 salt = bytes32(campaigns.length);

        // Deploy minimal proxy (returns the clone address)
        address clone = Clones.cloneDeterministic(campaignImplementation, salt);

        // Track the campaign BEFORE the external initialize call (checks-effects-interactions)
        campaigns.push(clone);
        campaignsByCreator[msg.sender].push(clone);
        isCampaign[clone] = true;

        Campaign(clone).initialize(msg.sender, goal, duration, ipfsHash);

        emit CampaignCreated(clone, msg.sender, goal, block.timestamp + duration, ipfsHash);

        return clone;
    }

    /**
     * @dev Predict the address of the next campaign that will be created
     * @return The deterministic address of the next campaign clone
     */
    function predictNextCampaignAddress() external view returns (address) {
        return campaignImplementation.predictDeterministicAddress(bytes32(campaigns.length));
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @dev Get all campaigns
     * @return Array of all campaign addresses
     */
    function getAllCampaigns() external view returns (address[] memory) {
        return campaigns;
    }

    /**
     * @dev Get campaigns created by a specific address
     * @param creator Creator address to query
     * @return Array of campaign addresses
     */
    function getCampaignsByCreator(address creator) external view returns (address[] memory) {
        return campaignsByCreator[creator];
    }

    /**
     * @dev Get total number of campaigns
     * @return Total campaign count
     */
    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    /**
     * @dev Get paginated campaigns
     * @param start Start index
     * @param limit Number of campaigns to return
     * @return Array of campaign addresses
     */
    function getCampaignsPaginated(
        uint256 start,
        uint256 limit
    ) external view returns (address[] memory) {
        if (start >= campaigns.length) revert StartIndexOutOfBounds();

        uint256 end = start + limit;
        if (end > campaigns.length) {
            end = campaigns.length;
        }

        uint256 resultLength = end - start;
        address[] memory result = new address[](resultLength);

        unchecked {
            for (uint256 i = 0; i < resultLength; i++) {
                result[i] = campaigns[start + i];
            }
        }

        return result;
    }

    /**
     * @dev Get campaign details in bulk
     * @param campaignAddresses Array of campaign addresses
     * @return creators Array of creators (zero for invalid addresses)
     * @return goals Array of funding goals
     * @return deadlines Array of deadlines
     * @return totalFunds Array of funds raised
     * @return goalReached Array of goal-reached flags
     * @return contributorsCount Array of contributor counts
     */
    function getCampaignDetailsBulk(
        address[] memory campaignAddresses
    ) external view returns (
        address[] memory creators,
        uint256[] memory goals,
        uint256[] memory deadlines,
        uint256[] memory totalFunds,
        bool[] memory goalReached,
        uint256[] memory contributorsCount
    ) {
        uint256 length = campaignAddresses.length;

        creators = new address[](length);
        goals = new uint256[](length);
        deadlines = new uint256[](length);
        totalFunds = new uint256[](length);
        goalReached = new bool[](length);
        contributorsCount = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            address campaignAddress = campaignAddresses[i];
            if (isCampaign[campaignAddress]) {
                Campaign campaign = Campaign(campaignAddress);
                (
                    creators[i],
                    goals[i],
                    deadlines[i],
                    totalFunds[i],
                    goalReached[i],
                    ,
                    ,
                    contributorsCount[i]
                ) = campaign.getCampaignDetails();
            }
        }
    }

    /**
     * @dev Get active campaigns (not ended, goal not reached, not cancelled)
     * @return Array of active campaign addresses
     */
    function getActiveCampaigns() external view returns (address[] memory) {
        uint256 length = campaigns.length;

        // First pass: count active campaigns
        uint256 activeCount = 0;
        for (uint256 i = 0; i < length; i++) {
            if (Campaign(campaigns[i]).isActive()) {
                activeCount++;
            }
        }

        // Second pass: populate array
        address[] memory activeCampaigns = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < length; i++) {
            address campaignAddress = campaigns[i];
            if (Campaign(campaignAddress).isActive()) {
                activeCampaigns[index] = campaignAddress;
                index++;
            }
        }

        return activeCampaigns;
    }

    /**
     * @dev Verify if an address is a campaign created by this factory
     * @param campaign Address to verify
     * @return True if it's a valid campaign
     */
    function verifyCampaign(address campaign) external view returns (bool) {
        return isCampaign[campaign];
    }
}
