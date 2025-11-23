// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Campaign
 * @dev Individual crowdfunding campaign contract
 * @notice This contract represents a single crowdfunding campaign with contributions, withdrawals, and refunds
 */
contract Campaign is ReentrancyGuard {
    // ============================================
    // STATE VARIABLES
    // ============================================

    address public immutable creator;          // Campaign creator (immutable for gas savings)
    uint256 public immutable goal;             // Funding goal in wei
    uint256 public immutable deadline;         // Campaign deadline (Unix timestamp)
    string public ipfsHash;                    // IPFS hash for campaign metadata

    uint256 public totalFunds;                 // Total funds raised
    bool public goalReached;                   // True if funding goal is met
    bool public fundsWithdrawn;                // True if creator has withdrawn funds

    mapping(address => uint256) public contributions;  // Track individual contributions
    address[] public contributors;                     // List of contributor addresses
    mapping(address => bool) public isContributor;     // Quick lookup for contributors

    // ============================================
    // EVENTS
    // ============================================

    event ContributionMade(address indexed contributor, uint256 amount);
    event GoalReached(uint256 totalAmount);
    event WithdrawalMade(address indexed creator, uint256 amount);
    event RefundClaimed(address indexed contributor, uint256 amount);

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator can call this function");
        _;
    }

    modifier campaignActive() {
        require(block.timestamp < deadline, "Campaign has ended");
        require(!goalReached, "Campaign goal already reached");
        _;
    }

    modifier afterDeadline() {
        require(block.timestamp >= deadline, "Campaign is still active");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @dev Create a new campaign
     * @param _creator Address of the campaign creator
     * @param _goal Funding goal in wei
     * @param _duration Campaign duration in seconds
     * @param _ipfsHash IPFS hash containing campaign metadata
     */
    constructor(
        address _creator,
        uint256 _goal,
        uint256 _duration,
        string memory _ipfsHash
    ) {
        require(_creator != address(0), "Invalid creator address");
        require(_goal > 0, "Goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");

        creator = _creator;
        goal = _goal;
        deadline = block.timestamp + _duration;
        ipfsHash = _ipfsHash;
    }

    // ============================================
    // EXTERNAL FUNCTIONS
    // ============================================

    /**
     * @dev Contribute ETH to the campaign
     * @notice Anyone can contribute while campaign is active
     */
    function contribute() external payable campaignActive nonReentrant {
        require(msg.value > 0, "Contribution must be greater than 0");

        // Add to contributor list if first contribution
        if (!isContributor[msg.sender]) {
            contributors.push(msg.sender);
            isContributor[msg.sender] = true;
        }

        // Update contribution amount
        contributions[msg.sender] += msg.value;
        totalFunds += msg.value;

        emit ContributionMade(msg.sender, msg.value);

        // Check if goal is reached
        if (totalFunds >= goal && !goalReached) {
            goalReached = true;
            emit GoalReached(totalFunds);
        }
    }

    /**
     * @dev Creator withdraws funds if goal is reached
     * @notice Can only be called by creator after goal is reached
     */
    function withdraw() external onlyCreator nonReentrant {
        require(goalReached, "Goal not reached");
        require(!fundsWithdrawn, "Funds already withdrawn");

        fundsWithdrawn = true;
        uint256 amount = address(this).balance;

        emit WithdrawalMade(creator, amount);

        // Transfer funds to creator
        (bool success, ) = payable(creator).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Contributors claim refund if goal not reached by deadline
     * @notice Can only be called after deadline if goal not reached
     */
    function refund() external afterDeadline nonReentrant {
        require(!goalReached, "Goal was reached, no refunds");
        require(contributions[msg.sender] > 0, "No contribution to refund");

        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0;  // Prevent re-entrancy

        emit RefundClaimed(msg.sender, amount);

        // Transfer refund to contributor
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @dev Get campaign details
     * @return Campaign information in a single call
     */
    function getCampaignDetails() external view returns (
        address _creator,
        uint256 _goal,
        uint256 _deadline,
        uint256 _totalFunds,
        bool _goalReached,
        bool _fundsWithdrawn,
        string memory _ipfsHash,
        uint256 _contributorsCount
    ) {
        return (
            creator,
            goal,
            deadline,
            totalFunds,
            goalReached,
            fundsWithdrawn,
            ipfsHash,
            contributors.length
        );
    }

    /**
     * @dev Get all contributors
     * @return Array of contributor addresses
     */
    function getContributors() external view returns (address[] memory) {
        return contributors;
    }

    /**
     * @dev Get contribution amount for a specific contributor
     * @param _contributor Address to query
     * @return Contribution amount in wei
     */
    function getContribution(address _contributor) external view returns (uint256) {
        return contributions[_contributor];
    }

    /**
     * @dev Check if campaign is active
     * @return True if campaign is still accepting contributions
     */
    function isActive() external view returns (bool) {
        return block.timestamp < deadline && !goalReached;
    }

    /**
     * @dev Get campaign state
     * @return 0: Active, 1: Successful, 2: Failed
     */
    function getState() external view returns (uint8) {
        if (block.timestamp < deadline && !goalReached) {
            return 0; // Active
        } else if (goalReached) {
            return 1; // Successful
        } else {
            return 2; // Failed
        }
    }

    /**
     * @dev Get remaining time until deadline
     * @return Seconds remaining (0 if deadline passed)
     */
    function getRemainingTime() external view returns (uint256) {
        if (block.timestamp >= deadline) {
            return 0;
        }
        return deadline - block.timestamp;
    }

    /**
     * @dev Calculate funding progress percentage
     * @return Progress as percentage (0-100+)
     */
    function getProgress() external view returns (uint256) {
        if (goal == 0) return 0;
        return (totalFunds * 100) / goal;
    }
}
