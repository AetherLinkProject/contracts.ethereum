const { ethers } = require("hardhat");

async function main() {
    const initialNodes = [
        "0x538540242093586B0e34b5df9B2207D028840800",
        "0xf8A143451383e5c5A58fDe92664dAe08FB9F7F1B",
        "0x00378D56583235ECc92E7157A8BdaC1483094223"
    ];

    const Ramp = await ethers.getContractFactory("Ramp");
    console.log("Deploying Ramp contract...");
    const ramp = await Ramp.deploy(initialNodes);
    await ramp.deployed();

    console.log("Ramp contract deployed to:", ramp.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });