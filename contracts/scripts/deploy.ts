import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: "../.env" });

async function main() {
    console.log("🚀 Deploying AgentMind CRE contracts to Ethereum Sepolia...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // USDC address on Ethereum Sepolia (mock/test USDC)
    const USDC_SEPOLIA = process.env.USDC_SEPOLIA || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    // Deploy AgentRegistry
    console.log("📝 Deploying AgentRegistry...");
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
    const agentRegistryAddress = await agentRegistry.getAddress();
    console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

    // Deploy PaymentGateway
    console.log("\n📝 Deploying PaymentGateway...");
    const PaymentGateway = await ethers.getContractFactory("PaymentGateway");
    const paymentGateway = await PaymentGateway.deploy(USDC_SEPOLIA);
    await paymentGateway.waitForDeployment();
    const paymentGatewayAddress = await paymentGateway.getAddress();
    console.log("✅ PaymentGateway deployed to:", paymentGatewayAddress);

    // Save deployment addresses
    const deploymentInfo = {
        network: "sepolia",
        chainId: 11155111,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            AgentRegistry: agentRegistryAddress,
            PaymentGateway: paymentGatewayAddress,
            USDC: USDC_SEPOLIA,
        },
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(deploymentsDir, "sepolia.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📄 Deployment info saved to deployments/sepolia.json");

    // Update .env file
    console.log("\n🔧 Updating .env file with contract addresses...");
    const envPath = path.join(__dirname, "../../.env");
    let envContent = fs.readFileSync(envPath, "utf8");

    envContent = envContent.replace(
        /AGENT_REGISTRY_ADDRESS=.*/,
        `AGENT_REGISTRY_ADDRESS=${agentRegistryAddress}`
    );
    envContent = envContent.replace(
        /PAYMENT_GATEWAY_ADDRESS=.*/,
        `PAYMENT_GATEWAY_ADDRESS=${paymentGatewayAddress}`
    );

    fs.writeFileSync(envPath, envContent);

    console.log("\n✨ Deployment complete!");
    console.log("\n📋 Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("AgentRegistry:", agentRegistryAddress);
    console.log("PaymentGateway:", paymentGatewayAddress);
    console.log("USDC (Sepolia):", USDC_SEPOLIA);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔍 Verify contracts on Etherscan:");
    console.log(`npx hardhat verify --network sepolia ${agentRegistryAddress}`);
    console.log(`npx hardhat verify --network sepolia ${paymentGatewayAddress} ${USDC_SEPOLIA}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
