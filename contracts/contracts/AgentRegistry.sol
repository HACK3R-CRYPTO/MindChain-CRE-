// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @dev ERC-8004 compliant AI agent identity and reputation registry
 *
 * This contract implements the ERC-8004 standard for trustless AI agents:
 * - Identity Registry: ERC-721 tokens for portable agent identifiers
 * - Reputation Registry: Standardized feedback and scoring
 * - Validation Registry: Verifying agent work and interactions
 */
contract AgentRegistry is ERC721, Ownable {
    struct Agent {
        uint256 tokenId;
        string name;
        int256 reputation;
        uint256 totalInteractions;
        uint256 registeredAt;
        string metadata; // IPFS hash or JSON metadata
    }

    // Mapping from agent address to Agent struct
    mapping(address => Agent) public agents;

    // Mapping from token ID to agent address
    mapping(uint256 => address) public tokenToAgent;

    // Counter for token IDs
    uint256 private _tokenIdCounter;

    // Authorized updaters (e.g., CRE workflow addresses)
    mapping(address => bool) public authorizedUpdaters;

    // Events
    event AgentRegistered(address indexed agent, uint256 tokenId, string name);
    event ReputationUpdated(
        address indexed agent,
        int256 oldReputation,
        int256 newReputation
    );
    event InteractionRecorded(
        address indexed agent,
        bytes32 queryHash,
        uint256 timestamp
    );
    event UpdaterAuthorized(address indexed updater, bool status);

    constructor() ERC721("AgentMind Identity", "AGENT") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    /**
     * @dev Register a new AI agent
     * @param name Human-readable agent name
     * @param metadata IPFS hash or JSON metadata
     */
    function registerAgent(
        string memory name,
        string memory metadata
    ) external {
        require(agents[msg.sender].tokenId == 0, "Agent already registered");

        uint256 tokenId = _tokenIdCounter++;

        agents[msg.sender] = Agent({
            tokenId: tokenId,
            name: name,
            reputation: 0,
            totalInteractions: 0,
            registeredAt: block.timestamp,
            metadata: metadata
        });

        tokenToAgent[tokenId] = msg.sender;
        _safeMint(msg.sender, tokenId);

        emit AgentRegistered(msg.sender, tokenId, name);
    }

    /**
     * @dev Update agent reputation (only authorized updaters)
     * @param agent Agent address
     * @param delta Reputation change (positive or negative)
     */
    function updateReputation(address agent, int256 delta) external {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "Not authorized to update reputation"
        );
        require(agents[agent].tokenId != 0, "Agent not registered");

        int256 oldReputation = agents[agent].reputation;
        agents[agent].reputation += delta;

        emit ReputationUpdated(agent, oldReputation, agents[agent].reputation);
    }

    /**
     * @dev Record an agent interaction
     * @param agent Agent address
     * @param queryHash Hash of the query/interaction
     */
    function recordInteraction(address agent, bytes32 queryHash) external {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "Not authorized to record interactions"
        );
        require(agents[agent].tokenId != 0, "Agent not registered");

        agents[agent].totalInteractions++;

        emit InteractionRecorded(agent, queryHash, block.timestamp);
    }

    /**
     * @dev Get agent information
     * @param agent Agent address
     * @return tokenId Agent's token ID
     * @return name Agent's name
     * @return reputation Agent's reputation score
     * @return totalInteractions Total number of interactions
     */
    function getAgentInfo(
        address agent
    )
        external
        view
        returns (
            uint256 tokenId,
            string memory name,
            int256 reputation,
            uint256 totalInteractions
        )
    {
        require(agents[agent].tokenId != 0, "Agent not registered");
        Agent memory a = agents[agent];
        return (a.tokenId, a.name, a.reputation, a.totalInteractions);
    }

    /**
     * @dev Authorize or revoke an updater (only owner)
     * @param updater Address to authorize/revoke
     * @param status Authorization status
     */
    function setAuthorizedUpdater(
        address updater,
        bool status
    ) external onlyOwner {
        authorizedUpdaters[updater] = status;
        emit UpdaterAuthorized(updater, status);
    }

    /**
     * @dev Check if an agent is registered
     * @param agent Agent address
     * @return bool Registration status
     */
    function isRegistered(address agent) external view returns (bool) {
        return agents[agent].tokenId != 0;
    }

    /**
     * @dev Get total number of registered agents
     * @return uint256 Total agents
     */
    function totalAgents() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Override transfer functions to make tokens soulbound (non-transferable)
     * This ensures agent identities remain tied to their original addresses
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "AgentMind: tokens are soulbound");
        return super._update(to, tokenId, auth);
    }
}
