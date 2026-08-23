// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title Campaign
 * @dev Individual crowdfunding campaign contract, deployed as a minimal proxy (EIP-1167 clone)
 *      by CrowdfundingFactory to minimize per-campaign deployment gas costs.
 * @notice Supports contributions, creator withdrawals on success, pull-based refunds on
 *         failure, and voluntary cancellation by the creator.
 */
contract Campaign is Initializable, ReentrancyGuard {
    // ============================================
    // CUSTOM ERRORS
    // ============================================

    error ZeroAddress();
    error ZeroGoal();
    error ZeroDuration();
    error EmptyIPFSHash();
    error AlreadyInitialized();
    error NotCreator();
    error ZeroValue();
    error CampaignEnded();
    error GoalAlreadyReached();
    error CampaignCancelledError();
    error GoalNotReached();
    error AlreadyWithdrawn();
    error NothingToRefund();
    error RefundsLocked();
    error TransferFailed();

    // ============================================
    // STATE VARIABLES
    // ============================================

    address public creator;        // Campaign creator
    uint256 public goal;           // Funding goal in wei
    uint256 public deadline;       // Campaign deadline (Unix timestamp)
    string public ipfsHash;        // IPFS hash for campaign metadata

    uint256 public totalFunds;     // Total funds raised
    uint256 public totalRefunded;  // Total funds refunded to contributors
    bool public goalReached;       // True if funding goal is met
    bool public fundsWithdrawn;    // True if creator has withdrawn funds
    bool public cancelled;         // True if creator cancelled the campaign

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
    event CampaignCancelled(address indexed creator);

    // ============================================
    // CONSTRUCTOR / INITIALIZER
    // ============================================

    /**
     * @custom:oz-upgrades-unsafe-allow constructor
     * @dev Deployed once as the implementation behind minimal proxies. Disables
     *      initializers so the logic contract can never be initialized itself.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize a cloned campaign. Callable exactly once by the factory.
     * @param creator_ Address of the campaign creator
     * @param goal_ Funding goal in wei
     * @param duration_ Campaign duration in seconds
     * @param ipfsHash_ IPFS hash containing campaign metadata
     */
    function initialize(
        address creator_,
        uint256 goal_,
        uint256 duration_,
        string calldata ipfsHash_
    ) external initializer {
        _validate(creator_, goal_, duration_, ipfsHash_);

        creator = creator_;
        goal = goal_;
        deadline = block.timestamp + duration_;
        ipfsHash = ipfsHash_;
    }

    // ============================================
    // EXTERNAL FUNCTIONS
    // ============================================

    /**
     * @dev Contribute ETH to the campaign
     * @notice Anyone can contribute while campaign is active
     */
    function contribute() external payable nonReentrant {
        if (cancelled) revert CampaignCancelledError();
        if (block.timestamp >= deadline) revert CampaignEnded();
        if (goalReached) revert GoalAlreadyReached();
        if (msg.value == 0) revert ZeroValue();

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
        if (totalFunds >= goal) {
            goalReached = true;
            emit GoalReached(totalFunds);
        }
    }

    /**
     * @dev Creator withdraws funds if goal is reached
     * @notice Can only be called by creator after goal is reached
     */
    function withdraw() external nonReentrant {
        if (msg.sender != creator) revert NotCreator();
        if (!goalReached) revert GoalNotReached();
        if (fundsWithdrawn) revert AlreadyWithdrawn();

        fundsWithdrawn = true;
        uint256 amount = address(this).balance;

        emit WithdrawalMade(creator, amount);

        (bool success,) = payable(creator).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Contributors claim refund if the goal was not reached by deadline,
     *      or immediately if the creator cancelled the campaign.
     */
    function refund() external nonReentrant {
        if (!cancelled) {
            if (block.timestamp < deadline) revert RefundsLocked();
            if (goalReached) revert RefundsLocked();
        }

        uint256 amount = contributions[msg.sender];
        if (amount == 0) revert NothingToRefund();

        contributions[msg.sender] = 0;  // Effects before interactions
        totalRefunded += amount;

        emit RefundClaimed(msg.sender, amount);

        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Creator cancels an active campaign. Contributors can then refund
     *      immediately via {refund}.
     */
    function cancel() external nonReentrant {
        if (msg.sender != creator) revert NotCreator();
        if (cancelled) revert CampaignCancelledError();
        if (goalReached) revert GoalAlreadyReached();
        if (block.timestamp >= deadline) revert CampaignEnded();

        cancelled = true;
        emit CampaignCancelled(creator);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @dev Get campaign details in a single call
     * @return creator_ Campaign creator address
     * @return goal_ Funding goal in wei
     * @return deadline_ Deadline as Unix timestamp
     * @return totalFunds_ Total funds raised
     * @return goalReached_ Whether funding goal was reached
     * @return fundsWithdrawn_ Whether creator withdrew funds
     * @return ipfsHash_ IPFS hash of campaign metadata
     * @return contributorsCount_ Number of unique contributors
     */
    function getCampaignDetails() external view returns (
        address creator_,
        uint256 goal_,
        uint256 deadline_,
        uint256 totalFunds_,
        bool goalReached_,
        bool fundsWithdrawn_,
        string memory ipfsHash_,
        uint256 contributorsCount_
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
     * @param contributor Address to query
     * @return Contribution amount in wei
     */
    function getContribution(address contributor) external view returns (uint256) {
        return contributions[contributor];
    }

    /**
     * @dev Check if campaign is accepting contributions
     * @return True if campaign is still active
     */
    function isActive() external view returns (bool) {
        return !cancelled && !goalReached && block.timestamp < deadline;
    }

    /**
     * @dev Get campaign state
     * @return 0: Active, 1: Successful, 2: Failed, 3: Cancelled
     */
    function getState() external view returns (uint8) {
        if (cancelled) {
            return 3; // Cancelled
        } else if (goalReached) {
            return 1; // Successful
        } else if (block.timestamp < deadline) {
            return 0; // Active
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

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    function _validate(
        address creator_,
        uint256 goal_,
        uint256 duration_,
        string calldata ipfsHash_
    ) private pure {
        if (creator_ == address(0)) revert ZeroAddress();
        if (goal_ == 0) revert ZeroGoal();
        if (duration_ == 0) revert ZeroDuration();
        if (bytes(ipfsHash_).length == 0) revert EmptyIPFSHash();
    }
}
