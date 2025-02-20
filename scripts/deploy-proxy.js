const { ethers } = require("hardhat");

async function main() {
    const RampImplementation = await ethers.getContractFactory("RampImplementation");
    console.log("Deploying RampImplementation...");
    const rampImplementation = await RampImplementation.deploy();
    await rampImplementation.deployed();
    console.log("RampImplementation deployed at:", rampImplementation.address);
    // 0x3098ca8e88EB08E713b2e8E5FFe428585C035F4f
    // 0xDBf9e558C3C6Dce6a7706937CC2f00f290BC831e

    const initialNodes = [
        "0x538540242093586B0e34b5df9B2207D028840800",
        "0xf8A143451383e5c5A58fDe92664dAe08FB9F7F1B",
        "0x00378D56583235ECc92E7157A8BdaC1483094223"
    ];
    const rampImplementationAddress = rampImplementation.address
    // const rampImplementationAddress = "0x3098ca8e88EB08E713b2e8E5FFe428585C035F4f"
    console.log('Lets deploy Ramp')
    const Ramp = await ethers.getContractFactory("Ramp");
    const ramp = await Ramp.deploy(initialNodes, rampImplementationAddress);
    await ramp.deployed();
    console.log(`Ramp address: ${ramp.address}`)
    // 0x88E0DF1a25D25138B5bE2D0e9801009b3Fd7ab95
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });