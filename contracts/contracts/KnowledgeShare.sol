// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KnowledgeShare
 * @dev Decentralized knowledge sharing with IPFS storage and on-chain verification
 *
 * Features:
 * - Submit knowledge to IPFS (stores CID on-chain)
 * - Community voting for verification
 * - Reputation system
 * - Payment for premium knowledge
 */
contract KnowledgeShare is Ownable {
    enum Status {
        Pending,
        Verified,
        Rejected
    }

    struct KnowledgeItem {
        string ipfsCid; // IPFS Content Identifier
        address owner; // Submitter
        uint256 price; // Price in wei (0 for free)
        string description; // Short description
        uint256 voteCount; // Upvotes
        Status status; // Verification status
        uint256 timestamp; // Submission time
        bool exists;
    }

    // State
    mapping(string => KnowledgeItem) public knowledge;
    string[] public allCids;

    // Reputation
    mapping(address => uint256) public reputation;

    // Voting: User => CID => bool
    mapping(address => mapping(string => bool)) public hasVoted;

    // Configuration
    uint256 public constant VOTE_THRESHOLD = 3;

    // Events
    event KnowledgeSubmitted(
        string indexed cid,
        address indexed owner,
        string description
    );
    event Voted(
        string indexed cid,
        address indexed voter,
        uint256 currentVotes
    );
    event KnowledgeVerified(string indexed cid, address indexed owner);
    event KnowledgePurchased(
        string indexed cid,
        address indexed buyer,
        uint256 price
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Submit knowledge (IPFS CID)
     * @param _ipfsCid IPFS content identifier
     * @param _description Short description
     * @param _price Price in wei (0 for free)
     */
    function submitKnowledge(
        string memory _ipfsCid,
        string memory _description,
        uint256 _price
    ) external {
        require(!knowledge[_ipfsCid].exists, "Knowledge already exists");
        require(bytes(_ipfsCid).length > 0, "Invalid CID");

        knowledge[_ipfsCid] = KnowledgeItem({
            ipfsCid: _ipfsCid,
            owner: msg.sender,
            price: _price,
            description: _description,
            voteCount: 0,
            status: Status.Pending,
            timestamp: block.timestamp,
            exists: true
        });

        allCids.push(_ipfsCid);
        emit KnowledgeSubmitted(_ipfsCid, msg.sender, _description);
    }

    /**
     * @dev Vote on pending knowledge
     * @param _cid IPFS CID to vote on
     */
    function vote(string memory _cid) external {
        KnowledgeItem storage item = knowledge[_cid];
        require(item.exists, "Knowledge not found");
        require(item.status == Status.Pending, "Already decided");
        require(!hasVoted[msg.sender][_cid], "Already voted");
        require(item.owner != msg.sender, "Cannot vote on own submission");

        hasVoted[msg.sender][_cid] = true;
        item.voteCount += 1;

        emit Voted(_cid, msg.sender, item.voteCount);

        // Auto-verify if threshold reached
        if (item.voteCount >= VOTE_THRESHOLD) {
            item.status = Status.Verified;
            reputation[item.owner] += 1;
            emit KnowledgeVerified(_cid, item.owner);
        }
    }

    /**
     * @dev Purchase access to premium knowledge
     * @param _cid IPFS CID
     */
    function purchaseAccess(string memory _cid) external payable {
        KnowledgeItem memory item = knowledge[_cid];
        require(item.exists, "Knowledge not found");
        require(msg.value >= item.price, "Insufficient payment");

        if (item.price > 0) {
            (bool success, ) = payable(item.owner).call{value: item.price}("");
            require(success, "Transfer failed");
        }

        // Refund excess
        if (msg.value > item.price) {
            (bool refund, ) = payable(msg.sender).call{
                value: msg.value - item.price
            }("");
            require(refund, "Refund failed");
        }

        emit KnowledgePurchased(_cid, msg.sender, item.price);
    }

    // View functions
    function getKnowledge(
        string memory _cid
    ) external view returns (KnowledgeItem memory) {
        return knowledge[_cid];
    }

    function getKnowledgeCount() external view returns (uint256) {
        return allCids.length;
    }

    function getCids(
        uint256 start,
        uint256 limit
    ) external view returns (string[] memory) {
        uint256 total = allCids.length;
        if (start >= total) return new string[](0);

        uint256 end = start + limit;
        if (end > total) end = total;

        string[] memory result = new string[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = allCids[i];
        }
        return result;
    }

    function getUserReputation(address user) external view returns (uint256) {
        return reputation[user];
    }
}
