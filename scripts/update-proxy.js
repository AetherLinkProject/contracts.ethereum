const { ethers } = require("hardhat");

async function main() {
    const RampImplementation = await ethers.getContractFactory("RampImplementation");
    console.log("Deploying new RampImplementation...");
    const rampImplementation = await RampImplementation.deploy();
    await rampImplementation.deployed();
    console.log("New RampImplementation deployed at:", rampImplementation.address);

    const rampProxyAddress = "0x88E0DF1a25D25138B5bE2D0e9801009b3Fd7ab95";
    console.log("Loading existing Ramp Proxy at:", rampProxyAddress);

    const RampProxy = await ethers.getContractAt("Ramp", rampProxyAddress);
    console.log(`Updating proxy to new implementation at ${rampImplementation.address}...`);
    const tx = await RampProxy.updateImplementation(rampImplementation.address);
    await tx.wait();
    console.log("Proxy implementation updated.");

    // const updatedImplementation = await RampProxy.implementation();
    // if (updatedImplementation === rampImplementation.address) {
    //     console.log("Proxy successfully updated to new implementation:", updatedImplementation);
    // } else {
    //     console.error("Proxy update failed. Current implementation:", updatedImplementation);
    // }

    // console.log("Testing functionality of new implementation...");
    // const rampWithNewLogic = await ethers.getContractAt("RampImplementation", rampProxyAddress);
    // const oracleNodes = await rampWithNewLogic.getOracleNodes();
    // console.log("Oracle nodes after upgrade:", oracleNodes);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });