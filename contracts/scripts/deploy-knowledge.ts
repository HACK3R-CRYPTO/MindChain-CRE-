import { ethers } from "hardhat";

async function main() {
    console.log("Deploying KnowledgeShare to Base Sepolia...");

    const KnowledgeShare = await ethers.getContractFactory("KnowledgeShare");
    const knowledgeShare = await KnowledgeShare.deploy();

    await knowledgeShare.waitForDeployment();

    const address = await knowledgeShare.getAddress();
    console.log("✅ KnowledgeShare deployed to:", address);
    console.log("🌐 Network: Base Sepolia (Chain ID: 84532)");
    console.log("\n📋 Add this to your .env.local:");
    console.log(`NEXT_PUBLIC_KNOWLEDGE_SHARE_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
