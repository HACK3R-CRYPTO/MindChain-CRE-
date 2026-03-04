import { ethers } from "hardhat";

async function main() {
    const AGENT_REGISTRY_ADDRESS = "0xB16DFC88DEA04642aAB9F06C3605FD0d1D3Bfd63";
    const USER_ADDRESS = "0xd2df53D9791e98Db221842Dd085F4144014BBE2a";

    console.log("Checking AgentRegistry at:", AGENT_REGISTRY_ADDRESS);

    const AgentRegistry = await ethers.getContractAt("AgentRegistry", AGENT_REGISTRY_ADDRESS);

    try {
        const isReg = await AgentRegistry.isRegistered(USER_ADDRESS);
        const count = await AgentRegistry.getAgentCount();
        console.log("📊 Global Agent Count:", count.toString());
        console.log("👤 User", USER_ADDRESS, "is registered:", isReg);

        if (isReg) {
            const info = await AgentRegistry.getAgentInfo(USER_ADDRESS);
            console.log("   - Token ID:", info.tokenId.toString());
            console.log("   - Name:", info.name);
            console.log("   - Reputation:", info.reputation.toString());
        }
    } catch (e) {
        console.error("❌ FAILED:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
