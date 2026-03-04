// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AgentRegistry
 * @dev Strict implementation of ERC-8004: Trustless Agents
 * Identity Registry component using ERC-721 with URIStorage.
 */
contract AgentRegistry is ERC721URIStorage, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    // Counter for token IDs (agentId)
    uint256 private _tokenIdCounter;

    // Mapping for on-chain metadata
    // agentId => metadataKey => metadataValue
    mapping(uint256 => mapping(string => bytes)) private _metadata;

    // Mapping for agent wallet
    mapping(uint256 => address) private _agentWallets;

    // Mapping for agent names (on-chain for easy AI retrieval)
    mapping(uint256 => string) private _agentNames;

    // Reserved metadata keys
    string public constant KEY_AGENT_WALLET = "agentWallet";

    // Events as per ERC-8004
    event Registered(
        uint256 indexed agentId,
        string agentURI,
        address indexed owner
    );
    event MetadataSet(
        uint256 indexed agentId,
        string indexed indexedMetadataKey,
        string metadataKey,
        bytes metadataValue
    );
    event URIUpdated(
        uint256 indexed agentId,
        string newURI,
        address indexed updatedBy
    );

    constructor() ERC721("AgentMind Identity", "AGENT") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    /**
     * @dev Register a new agent with URI and initial metadata
     */
    function register(
        string calldata name,
        string calldata agentURI,
        MetadataEntry[] calldata metadata
    ) external returns (uint256 agentId) {
        agentId = _tokenIdCounter++;
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);

        _agentNames[agentId] = name;

        // Set default agent wallet to owner
        _agentWallets[agentId] = msg.sender;
        emit MetadataSet(
            agentId,
            KEY_AGENT_WALLET,
            KEY_AGENT_WALLET,
            abi.encodePacked(msg.sender)
        );

        // Set additional metadata
        for (uint256 i = 0; i < metadata.length; i++) {
            require(
                keccak256(bytes(metadata[i].metadataKey)) !=
                    keccak256(bytes(KEY_AGENT_WALLET)),
                "Reserved key"
            );
            _metadata[agentId][metadata[i].metadataKey] = metadata[i]
                .metadataValue;
            emit MetadataSet(
                agentId,
                metadata[i].metadataKey,
                metadata[i].metadataKey,
                metadata[i].metadataValue
            );
        }

        emit Registered(agentId, agentURI, msg.sender);
        return agentId;
    }

    /**
     * @dev Simple registration with URI
     */
    function register(
        string calldata name,
        string calldata agentURI
    ) external returns (uint256 agentId) {
        agentId = _tokenIdCounter++;
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);

        _agentNames[agentId] = name;

        // Set default agent wallet to owner
        _agentWallets[agentId] = msg.sender;
        emit MetadataSet(
            agentId,
            KEY_AGENT_WALLET,
            KEY_AGENT_WALLET,
            abi.encodePacked(msg.sender)
        );

        emit Registered(agentId, agentURI, msg.sender);
        return agentId;
    }

    /**
     * @dev Minimal registration
     */
    function register() external returns (uint256 agentId) {
        agentId = _tokenIdCounter++;
        _safeMint(msg.sender, agentId);

        // Set default agent wallet to owner
        _agentWallets[agentId] = msg.sender;
        emit MetadataSet(
            agentId,
            KEY_AGENT_WALLET,
            KEY_AGENT_WALLET,
            abi.encodePacked(msg.sender)
        );

        emit Registered(agentId, "", msg.sender);
        return agentId;
    }

    /**
     * @dev Update agent URI
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        _checkOwner(msg.sender, agentId);
        _setTokenURI(agentId, newURI);
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    /**
     * @dev Get on-chain metadata
     */
    function getMetadata(
        uint256 agentId,
        string calldata metadataKey
    ) external view returns (bytes memory) {
        if (
            keccak256(bytes(metadataKey)) == keccak256(bytes(KEY_AGENT_WALLET))
        ) {
            return abi.encodePacked(_agentWallets[agentId]);
        }
        return _metadata[agentId][metadataKey];
    }

    /**
     * @dev Set on-chain metadata
     */
    function setMetadata(
        uint256 agentId,
        string calldata metadataKey,
        bytes calldata metadataValue
    ) external {
        _checkOwner(msg.sender, agentId);
        require(
            keccak256(bytes(metadataKey)) != keccak256(bytes(KEY_AGENT_WALLET)),
            "Use setAgentWallet"
        );

        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }

    /**
     * @dev Set authorized agent wallet with signature verification
     */
    function setAgentWallet(
        uint256 agentId,
        address newWallet,
        uint256 deadline,
        bytes calldata signature
    ) external {
        _checkOwner(msg.sender, agentId);
        require(block.timestamp <= deadline, "Signature expired");

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "SetAgentWallet(uint256 agentId,address newWallet,uint256 deadline)"
                ),
                agentId,
                newWallet,
                deadline
            )
        );

        bytes32 hash = structHash.toEthSignedMessageHash();
        address signer = hash.recover(signature);
        require(signer == newWallet, "Invalid signature from new wallet");

        _agentWallets[agentId] = newWallet;
        emit MetadataSet(
            agentId,
            KEY_AGENT_WALLET,
            KEY_AGENT_WALLET,
            abi.encodePacked(newWallet)
        );
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }

    function unsetAgentWallet(uint256 agentId) external {
        _checkOwner(msg.sender, agentId);
        _agentWallets[agentId] = address(0);
        emit MetadataSet(agentId, KEY_AGENT_WALLET, KEY_AGENT_WALLET, "");
    }

    /**
     * @dev Check registration status
     */
    function isRegistered(address agent) public view returns (bool) {
        // In this implementation, the token owner is the registered agent identity
        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) == agent) return true;
        }
        return false;
    }

    /**
     * @dev Get detailed agent info for AI/Frontend use
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
        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) == agent) {
                return (i, _agentNames[i], 100, 0); // Mocking rep/interactions for now
            }
        }
        revert("Agent not registered");
    }

    function getAgentName(
        uint256 agentId
    ) external view returns (string memory) {
        return _agentNames[agentId];
    }

    /**
     * @dev Get total number of registered agents
     */
    function getAgentCount() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Soulbound logic: Reset agentWallet on transfer
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        // Clear wallet on transfer as per spec
        if (from != address(0) && to != address(0)) {
            _agentWallets[tokenId] = address(0);
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Internal helper to check owner or authorized
     */
    function _checkOwner(address spender, uint256 agentId) internal view {
        require(
            _ownerOf(agentId) == spender ||
                isApprovedForAll(_ownerOf(agentId), spender),
            "Not owner nor approved"
        );
    }

    /**
     * @dev Required override for ERC721URIStorage
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Required override for ERC721URIStorage
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
