// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PaymentGateway
 * @dev x402 payment verification and settlement contract
 *
 * This contract handles:
 * - USDC payment verification for AI services
 * - Payment ledger for audit trail
 * - Fee collection and withdrawal
 */
contract PaymentGateway is Ownable {
    IERC20 public immutable usdc;

    struct Payment {
        address payer;
        uint256 amount;
        uint256 timestamp;
        bytes32 queryHash;
        bool verified;
    }

    // Mapping from transaction hash to Payment
    mapping(bytes32 => Payment) public payments;

    // Mapping from user to their payment history
    mapping(address => bytes32[]) public userPayments;

    // Service fee (in basis points, e.g., 100 = 1%)
    uint256 public serviceFee = 100; // 1%

    // Accumulated fees
    uint256 public accumulatedFees;

    // Minimum payment amount (in USDC, 6 decimals)
    uint256 public minPaymentAmount = 10000; // 0.01 USDC

    // Events
    event PaymentReceived(
        address indexed payer,
        bytes32 indexed txHash,
        uint256 amount,
        bytes32 queryHash
    );
    event PaymentVerified(bytes32 indexed txHash, address indexed payer);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event ServiceFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Record a payment (called after USDC transfer)
     * @param txHash Transaction hash
     * @param amount Payment amount
     * @param queryHash Hash of the query being paid for
     */
    function recordPayment(
        bytes32 txHash,
        uint256 amount,
        bytes32 queryHash
    ) external {
        require(amount >= minPaymentAmount, "Payment amount too low");
        require(
            payments[txHash].payer == address(0),
            "Payment already recorded"
        );

        // Transfer USDC from payer to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        // Calculate and deduct service fee
        uint256 fee = (amount * serviceFee) / 10000;
        accumulatedFees += fee;

        payments[txHash] = Payment({
            payer: msg.sender,
            amount: amount - fee,
            timestamp: block.timestamp,
            queryHash: queryHash,
            verified: true
        });

        userPayments[msg.sender].push(txHash);

        emit PaymentReceived(msg.sender, txHash, amount, queryHash);
        emit PaymentVerified(txHash, msg.sender);
    }

    /**
     * @dev Verify if a payment exists and is valid
     * @param txHash Transaction hash
     * @return bool Payment verification status
     */
    function verifyPayment(bytes32 txHash) external view returns (bool) {
        return
            payments[txHash].verified && payments[txHash].payer != address(0);
    }

    /**
     * @dev Get payment details
     * @param txHash Transaction hash
     * @return payer Payer address
     * @return amount Payment amount
     * @return timestamp Payment timestamp
     * @return queryHash Query hash
     * @return verified Verification status
     */
    function getPayment(
        bytes32 txHash
    )
        external
        view
        returns (
            address payer,
            uint256 amount,
            uint256 timestamp,
            bytes32 queryHash,
            bool verified
        )
    {
        Payment memory p = payments[txHash];
        return (p.payer, p.amount, p.timestamp, p.queryHash, p.verified);
    }

    /**
     * @dev Get user's payment history
     * @param user User address
     * @return bytes32[] Array of transaction hashes
     */
    function getUserPayments(
        address user
    ) external view returns (bytes32[] memory) {
        return userPayments[user];
    }

    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");

        accumulatedFees = 0;
        require(usdc.transfer(owner(), amount), "USDC transfer failed");

        emit FeesWithdrawn(owner(), amount);
    }

    /**
     * @dev Update service fee (only owner)
     * @param newFee New fee in basis points
     */
    function setServiceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high (max 10%)");
        uint256 oldFee = serviceFee;
        serviceFee = newFee;
        emit ServiceFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Update minimum payment amount (only owner)
     * @param newAmount New minimum amount
     */
    function setMinPaymentAmount(uint256 newAmount) external onlyOwner {
        minPaymentAmount = newAmount;
    }

    /**
     * @dev Get contract balance
     * @return uint256 USDC balance
     */
    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
