const { ethers } = require("hardhat");

async function main() {
    const rampProxyAddress = "0x88E0DF1a25D25138B5bE2D0e9801009b3Fd7ab95";
    console.log("Loading existing Ramp Proxy at:", rampProxyAddress);

    const newOracleNodes = [
        "0x2ee47C2EC30BDfBb648Aec5F6233714e78c53cb5",
        "0xf03b4C23C82f6387Fcc822B6B7135f6554CF2C08",
        "0xa4372805e2cbc9105ee03262E6bc22Bad55Fbe85",
        "0xf245Fc8AF56B781AfcCC66733cd608a7430E9124",
        "0x947B9Bead05706Dc16Fae0A53953AA70bEa8fE19"
    ];

    const RampImplementation = await ethers.getContractAt("RampImplementation", rampProxyAddress);
    console.log(`Updating Oracle Nodes to: ${newOracleNodes}`);

    const tx = await RampImplementation.updateOracleNodes(newOracleNodes);
    await tx.wait();

    console.log("Oracle nodes updated successfully!");

    const updatedOracleNodes = await RampImplementation.getOracleNodes();
    console.log("Updated Oracle Nodes:", updatedOracleNodes);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });