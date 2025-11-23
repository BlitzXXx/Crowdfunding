// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Campaign.sol";

/**
 * @title CrowdfundingFactory
 * @dev Factory contract for creating and tracking Campaign contracts
 * @notice This contract uses the factory pattern to deploy individual campaign contracts
 */
contract CrowdfundingFactory {
    // ============================================
    // STATE VARIABLES
    // ============================================

    address[] public campaigns;                              // All deployed campaigns
    mapping(address => address[]) public campaignsByCreator; // Campaigns by creator
    mapping(address => bool) public isCampaign;              // Quick lookup for valid campaigns

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
    // EXTERNAL FUNCTIONS
    // ============================================

    /**
     * @dev Create a new crowdfunding campaign
     * @param _goal Funding goal in wei
     * @param _duration Campaign duration in seconds
     * @param _ipfsHash IPFS hash containing campaign metadata
     * @return The address of the newly created campaign
     */
    function createCampaign(
        uint256 _goal,
        uint256 _duration,
        string memory _ipfsHash
    ) external returns (address) {
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_duration <= 365 days, "Duration too long (max 365 days)");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        // Deploy new Campaign contract
        Campaign newCampaign = new Campaign(
            msg.sender,
            _goal,
            _duration,
            _ipfsHash
        );

        address campaignAddress = address(newCampaign);

        // Track the campaign
        campaigns.push(campaignAddress);
        campaignsByCreator[msg.sender].push(campaignAddress);
        isCampaign[campaignAddress] = true;

        emit CampaignCreated(
            campaignAddress,
            msg.sender,
            _goal,
            block.timestamp + _duration,
            _ipfsHash
        );

        return campaignAddress;
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
     * @param _creator Creator address to query
     * @return Array of campaign addresses
     */
    function getCampaignsByCreator(address _creator) external view returns (address[] memory) {
        return campaignsByCreator[_creator];
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
     * @param _start Start index
     * @param _limit Number of campaigns to return
     * @return Array of campaign addresses
     */
    function getCampaignsPaginated(
        uint256 _start,
        uint256 _limit
    ) external view returns (address[] memory) {
        require(_start < campaigns.length, "Start index out of bounds");

        uint256 end = _start + _limit;
        if (end > campaigns.length) {
            end = campaigns.length;
        }

        uint256 resultLength = end - _start;
        address[] memory result = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = campaigns[_start + i];
        }

        return result;
    }

    /**
     * @dev Get campaign details in bulk
     * @param _campaignAddresses Array of campaign addresses
     * @return Array of campaign details
     */
    function getCampaignDetailsBulk(
        address[] memory _campaignAddresses
    ) external view returns (
        address[] memory creators,
        uint256[] memory goals,
        uint256[] memory deadlines,
        uint256[] memory totalFunds,
        bool[] memory goalReached,
        uint256[] memory contributorsCount
    ) {
        uint256 length = _campaignAddresses.length;

        creators = new address[](length);
        goals = new uint256[](length);
        deadlines = new uint256[](length);
        totalFunds = new uint256[](length);
        goalReached = new bool[](length);
        contributorsCount = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            if (isCampaign[_campaignAddresses[i]]) {
                Campaign campaign = Campaign(_campaignAddresses[i]);
                (
                    address creator,
                    uint256 goal,
                    uint256 deadline,
                    uint256 total,
                    bool reached,
                    ,
                    ,
                    uint256 count
                ) = campaign.getCampaignDetails();

                creators[i] = creator;
                goals[i] = goal;
                deadlines[i] = deadline;
                totalFunds[i] = total;
                goalReached[i] = reached;
                contributorsCount[i] = count;
            }
        }

        return (creators, goals, deadlines, totalFunds, goalReached, contributorsCount);
    }

    /**
     * @dev Get active campaigns (not ended and goal not reached)
     * @return Array of active campaign addresses
     */
    function getActiveCampaigns() external view returns (address[] memory) {
        // First pass: count active campaigns
        uint256 activeCount = 0;
        for (uint256 i = 0; i < campaigns.length; i++) {
            Campaign campaign = Campaign(campaigns[i]);
            if (campaign.isActive()) {
                activeCount++;
            }
        }

        // Second pass: populate array
        address[] memory activeCampaigns = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < campaigns.length; i++) {
            Campaign campaign = Campaign(campaigns[i]);
            if (campaign.isActive()) {
                activeCampaigns[index] = campaigns[i];
                index++;
            }
        }

        return activeCampaigns;
    }

    /**
     * @dev Verify if an address is a campaign created by this factory
     * @param _campaign Address to verify
     * @return True if it's a valid campaign
     */
    function verifyCampaign(address _campaign) external view returns (bool) {
        return isCampaign[_campaign];
    }
}
