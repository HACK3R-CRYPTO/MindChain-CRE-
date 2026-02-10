import { ethers } from "hardhat";

async function main() {
    console.log("Deploying PaymentGateway to Base Sepolia...");

    // Base Sepolia USDC address
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    const PaymentGateway = await ethers.getContractFactory("PaymentGateway");
    const paymentGateway = await PaymentGateway.deploy(USDC_ADDRESS);

    await paymentGateway.waitForDeployment();

    const address = await paymentGateway.getAddress();
    console.log("✅ PaymentGateway deployed to:", address);
    console.log("📝 USDC Address:", USDC_ADDRESS);
    console.log("🌐 Network: Base Sepolia (Chain ID: 84532)");
    console.log("\n📋 Add this to your .env.local:");
    console.log(`NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
