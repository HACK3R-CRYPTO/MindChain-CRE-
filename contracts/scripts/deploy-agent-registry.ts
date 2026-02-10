import { ethers } from "hardhat";

async function main() {
    console.log("Deploying AgentRegistry to Base Sepolia...");

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy();

    await agentRegistry.waitForDeployment();

    const address = await agentRegistry.getAddress();
    console.log("✅ AgentRegistry deployed to:", address);
    console.log("🌐 Network: Base Sepolia (Chain ID: 84532)");
    console.log("\n📋 Add this to your .env.local:");
    console.log(`NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
