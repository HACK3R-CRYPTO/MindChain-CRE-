import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying ERC-8004 Compliance Suite to Base Sepolia...");

    // 1. Deploy Identity Registry (AgentRegistry)
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
    const agentRegistryAddress = await agentRegistry.getAddress();
    console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

    // 2. Deploy Reputation Registry
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const reputationRegistry = await ReputationRegistry.deploy(agentRegistryAddress);
    await reputationRegistry.waitForDeployment();
    const reputationRegistryAddress = await reputationRegistry.getAddress();
    console.log("✅ ReputationRegistry deployed to:", reputationRegistryAddress);

    console.log("\n📋 Update your .env.local with these addresses:");
    console.log(`NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${agentRegistryAddress}`);
    console.log(`NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS=${reputationRegistryAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
