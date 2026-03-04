import { ethers } from "hardhat";

async function main() {
    const agentRegistryAddress = "0x8EDbB6A586042dd522b52792729e88c353892a1E";
    console.log("🚀 Deploying ReputationRegistry to Base Sepolia...");

    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const reputationRegistry = await ReputationRegistry.deploy(agentRegistryAddress);
    await reputationRegistry.waitForDeployment();
    const reputationRegistryAddress = await reputationRegistry.getAddress();
    console.log("✅ ReputationRegistry deployed to:", reputationRegistryAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
