// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentRegistry.sol";

/**
 * @title KnowledgeShare
 * @dev Community knowledge sharing and voting system
 *
 * This contract allows users to:
 * - Submit knowledge/tips to the community
 * - Vote on submitted knowledge
 * - Earn reputation for quality submissions
 */
contract KnowledgeShare {
    struct Knowledge {
        address submitter;
        string content;
        uint256 votes;
        uint256 timestamp;
        bool approved;
    }

    AgentRegistry public agentRegistry;

    // Array of all knowledge submissions
    Knowledge[] public knowledgeBase;

    // Mapping from user to their submissions
    mapping(address => uint256[]) public userSubmissions;

    // Mapping to track if user has voted on a submission
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Minimum votes needed for approval
    uint256 public constant APPROVAL_THRESHOLD = 3;

    // Events
    event KnowledgeSubmitted(
        uint256 indexed id,
        address indexed submitter,
        string content
    );
    event KnowledgeVoted(uint256 indexed id, address indexed voter);
    event KnowledgeApproved(uint256 indexed id);

    constructor(address _agentRegistry) {
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    /**
     * @dev Submit new knowledge to the community
     * @param content The knowledge content
     */
    function submitKnowledge(string memory content) external {
        require(bytes(content).length > 0, "Content cannot be empty");
        require(bytes(content).length <= 500, "Content too long");

        uint256 id = knowledgeBase.length;

        knowledgeBase.push(
            Knowledge({
                submitter: msg.sender,
                content: content,
                votes: 0,
                timestamp: block.timestamp,
                approved: false
            })
        );

        userSubmissions[msg.sender].push(id);

        emit KnowledgeSubmitted(id, msg.sender, content);
    }

    /**
     * @dev Vote on a knowledge submission
     * @param id Knowledge ID
     */
    function voteKnowledge(uint256 id) external {
        require(id < knowledgeBase.length, "Invalid knowledge ID");
        require(!hasVoted[id][msg.sender], "Already voted");
        require(
            knowledgeBase[id].submitter != msg.sender,
            "Cannot vote on own submission"
        );

        hasVoted[id][msg.sender] = true;
        knowledgeBase[id].votes++;

        emit KnowledgeVoted(id, msg.sender);

        // Auto-approve if threshold reached
        if (
            knowledgeBase[id].votes >= APPROVAL_THRESHOLD &&
            !knowledgeBase[id].approved
        ) {
            knowledgeBase[id].approved = true;

            // Reward submitter with reputation if they're a registered agent
            if (agentRegistry.isRegistered(knowledgeBase[id].submitter)) {
                // This would be called by the CRE workflow
                // agentRegistry.updateReputation(knowledgeBase[id].submitter, 5);
            }

            emit KnowledgeApproved(id);
        }
    }

    /**
     * @dev Get all knowledge submissions
     * @return Knowledge[] Array of all submissions
     */
    function getAllKnowledge() external view returns (Knowledge[] memory) {
        return knowledgeBase;
    }

    /**
     * @dev Get approved knowledge only
     * @return Knowledge[] Array of approved submissions
     */
    function getApprovedKnowledge() external view returns (Knowledge[] memory) {
        uint256 approvedCount = 0;
        for (uint256 i = 0; i < knowledgeBase.length; i++) {
            if (knowledgeBase[i].approved) {
                approvedCount++;
            }
        }

        Knowledge[] memory approved = new Knowledge[](approvedCount);
        uint256 index = 0;
        for (uint256 i = 0; i < knowledgeBase.length; i++) {
            if (knowledgeBase[i].approved) {
                approved[index] = knowledgeBase[i];
                index++;
            }
        }

        return approved;
    }

    /**
     * @dev Get user's submissions
     * @param user User address
     * @return uint256[] Array of knowledge IDs
     */
    function getUserSubmissions(
        address user
    ) external view returns (uint256[] memory) {
        return userSubmissions[user];
    }

    /**
     * @dev Get total number of submissions
     * @return uint256 Total count
     */
    function getTotalKnowledge() external view returns (uint256) {
        return knowledgeBase.length;
    }
}
