const { run } = require("hardhat");

async function main() {
    const contractAddress = "0x88E0DF1a25D25138B5bE2D0e9801009b3Fd7ab95";
    const constructorArgs = [];
    const contractName = "contracts/RampImplementation.sol:RampImplementation";

    console.log(`Verifying contract at address: ${contractAddress}...`);

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArgs,
            contract: contractName,
        });
        console.log(`RampImplementation contract verified at address: ${contractAddress}`);
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Contract is already verified.");
        } else {
            console.error("Verification failed:", error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });