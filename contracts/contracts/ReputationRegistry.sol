// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IAgentIdentity {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title ReputationRegistry
 * @dev Strict implementation of ERC-8004 Reputation Registry
 */
contract ReputationRegistry is Ownable {
    struct Feedback {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        bool isRevoked;
    }

    // Reference to Identity Registry
    address public identityRegistry;

    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback)))
        private _feedbacks;

    // agentId => clientAddress => lastIndex
    mapping(uint256 => mapping(address => uint64)) private _lastIndexes;

    // agentId => list of client addresses who gave feedback
    mapping(uint256 => address[]) private _clients;
    mapping(uint256 => mapping(address => bool)) private _isClient;

    // Events as per ERC-8004
    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );

    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );

    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        address indexed responder,
        string responseURI,
        bytes32 responseHash
    );

    constructor(address identityRegistry_) Ownable(msg.sender) {
        identityRegistry = identityRegistry_;
    }

    /**
     * @dev Give feedback to an agent
     */
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        require(valueDecimals <= 18, "Invalid decimals");

        // Ensure agent exists (can call ownerOf and check it doesn't revert or returns non-zero)
        address agentOwner = IAgentIdentity(identityRegistry).ownerOf(agentId);
        require(agentOwner != address(0), "Agent not registered");
        require(msg.sender != agentOwner, "Self-feedback not allowed");

        _lastIndexes[agentId][msg.sender]++;
        uint64 index = _lastIndexes[agentId][msg.sender];

        _feedbacks[agentId][msg.sender][index] = Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false
        });

        if (!_isClient[agentId][msg.sender]) {
            _clients[agentId].push(msg.sender);
            _isClient[agentId][msg.sender] = true;
        }

        emit NewFeedback(
            agentId,
            msg.sender,
            index,
            value,
            valueDecimals,
            tag1,
            tag1,
            tag2,
            endpoint,
            feedbackURI,
            feedbackHash
        );
    }

    /**
     * @dev Revoke previously given feedback
     */
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        require(
            _feedbacks[agentId][msg.sender][feedbackIndex].value != 0 ||
                _feedbacks[agentId][msg.sender][feedbackIndex].isRevoked,
            "Feedback not found"
        );
        _feedbacks[agentId][msg.sender][feedbackIndex].isRevoked = true;
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    /**
     * @dev Append a response to feedback
     */
    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        emit ResponseAppended(
            agentId,
            clientAddress,
            feedbackIndex,
            msg.sender,
            responseURI,
            responseHash
        );
    }

    /**
     * @dev Get aggregated summary of feedback for an agent
     * For demo, we do a simple average across provided clients.
     */
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    )
        external
        view
        returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)
    {
        int256 total = 0;
        uint64 validCount = 0;

        for (uint256 i = 0; i < clientAddresses.length; i++) {
            uint64 lastIdx = _lastIndexes[agentId][clientAddresses[i]];
            for (uint64 j = 1; j <= lastIdx; j++) {
                Feedback storage f = _feedbacks[agentId][clientAddresses[i]][j];
                if (f.isRevoked) continue;

                // Filter by tags if provided
                if (
                    bytes(tag1).length > 0 &&
                    keccak256(bytes(f.tag1)) != keccak256(bytes(tag1))
                ) continue;
                if (
                    bytes(tag2).length > 0 &&
                    keccak256(bytes(f.tag2)) != keccak256(bytes(tag2))
                ) continue;

                // Simple sum (assuming common decimals for simplicity in demo or normalize them)
                // In full implementation, we would normalize decimals to 18
                total += int256(f.value);
                validCount++;
            }
        }

        if (validCount > 0) {
            summaryValue = int128(total / int256(uint256(validCount)));
            summaryValueDecimals = 0; // Simplified for demo
        }

        return (validCount, summaryValue, summaryValueDecimals);
    }

    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    )
        external
        view
        returns (
            int128 value,
            uint8 valueDecimals,
            string memory tag1,
            string memory tag2,
            bool isRevoked
        )
    {
        Feedback storage f = _feedbacks[agentId][clientAddress][feedbackIndex];
        return (f.value, f.valueDecimals, f.tag1, f.tag2, f.isRevoked);
    }

    function getClients(
        uint256 agentId
    ) external view returns (address[] memory) {
        return _clients[agentId];
    }

    function getLastIndex(
        uint256 agentId,
        address clientAddress
    ) external view returns (uint64) {
        return _lastIndexes[agentId][clientAddress];
    }

    function getIdentityRegistry() external view returns (address) {
        return identityRegistry;
    }
}
