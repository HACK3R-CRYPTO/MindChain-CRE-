import { ethers } from "hardhat";

async function main() {
    const REGISTRY_ADDRESS = "0x8EDbB6A586042dd522b52792729e88c353892a1E";

    console.log(`Connecting to AgentRegistry at: ${REGISTRY_ADDRESS} on Base Sepolia...`);

    const AgentRegistry = await ethers.getContractAt("AgentRegistry", REGISTRY_ADDRESS);

    console.log(`\nIterating through registered agents...\n`);
    console.log(`----------------------------------------------------------------------`);
    console.log(`| ID  | Owner Address                               | URI`);
    console.log(`----------------------------------------------------------------------`);

    let id = 1;
    let found = 0;
    const maxChecked = 50; // Safety limit for the loop

    while (id <= maxChecked) {
        try {
            const owner = await AgentRegistry.ownerOf(id);
            let uri = "";
            try {
                uri = await AgentRegistry.tokenURI(id);
            } catch (e) {
                uri = "[No URI]";
            }

            console.log(`| ${id.toString().padEnd(3)} | ${owner.padEnd(42)} | ${uri}`);
            found++;
        } catch (error) {
            // ownerOf reverts if token doesn't exist
            break;
        }
        id++;
    }

    if (found === 0) {
        console.log(`| No agents found.                                                   |`);
    }
    console.log(`----------------------------------------------------------------------`);
    console.log(`Total Found: ${found}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
