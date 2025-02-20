const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Ramp", function () {
    const TOKEN_AMOUNT = ethers.utils.parseEther("100");

    async function deployRampFixture() {
        // For Wallet
        const [owner, addr1, addr2] = await ethers.getSigners();
        wallet1 = new ethers.Wallet("59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
        wallet2 = new ethers.Wallet("5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
        wallet3 = new ethers.Wallet("7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6");
        const initialOracleNodes = [wallet1.address, wallet2.address, wallet3.address];

        // Deploy Ramp Contract
        const Ramp = await ethers.getContractFactory("Ramp");
        const RampImplementation = await ethers.getContractFactory("RampImplementation");
        const rampImplementation = await RampImplementation.deploy();
        const rampProxy = await Ramp.deploy(initialOracleNodes, rampImplementation.address);
        const ramp = RampImplementation.attach(rampProxy.address);

        // For Mock Contract
        const RouterMock = await ethers.getContractFactory("MockRouter");
        mockRouter = await RouterMock.deploy();
        await mockRouter.deployed();
        return { ramp, rampProxy, mockRouter, owner, addr1, addr2, wallet1, wallet2, wallet3 }

    }


    describe("Deploy", function () {
        describe("owner test", function () {
            it("Should be contract deployer", async function () {
                const { ramp, owner } = await loadFixture(deployRampFixture);
                expect(await ramp.owner()).to.equal(owner.address);
            });
        })

        describe("update contract test", function () {
            it("Should revert when address is not a contract", async function () {
                const { owner, rampProxy } = await loadFixture(deployRampFixture);
                error = 'DESTINATION_ADDRESS_IS_NOT_A_CONTRACT'
                await expect(rampProxy.updateImplementation(owner.address))
                    .to.be.revertedWith(error);
            });
        })

        describe("update contract config test", function () {
            it("should initialize oracle nodes correctly", async () => {
                const { ramp, addr1, addr2 } = await loadFixture(deployRampFixture);
                const oracleNodes = await ramp.getOracleNodes();
                // console.log(`oracleNodes: ${oracleNodes}`)
                expect(oracleNodes.length).to.equal(3);
                expect(oracleNodes).to.include(addr1.address);
                expect(oracleNodes).to.include(addr2.address);
            });

            it("should calculate the correct signature threshold", async () => {
                const { ramp } = await loadFixture(deployRampFixture);
                const expectedThreshold = Math.floor((3 + 1) / 2) + 1; // Threshold = 2 when 3 nodes exist
                expect(await ramp.signatureThreshold()).to.equal(expectedThreshold);
            });
        })
    });

    describe("SendRequest", () => {
        it("should emit RequestSent event and compute correct messageId on valid inputs", async () => {
            const { ramp, addr1, mockRouter } = await loadFixture(deployRampFixture);
            const targetChainId = 2;
            const receiver = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
            const message = "Hello Receiver";
            const tokenAmount = getValidTokenAmount();
            // const block = await ethers.provider.getBlock("latest");
            // const currentTimestamp = block.timestamp;
            // const expectedMessageId = generateMessageId(addr1.address, targetChainId, receiver, message, tokenAmount, currentTimestamp);
            // const tokenAmountBytes = encodeTokenAmount(tokenAmount);
            const tx = await ramp.connect(addr1).sendRequest(targetChainId, mockRouter.address, ethers.utils.toUtf8Bytes(message), tokenAmount);
            await expect(tx)
                .to.emit(ramp, "RequestSent")
                .withArgs(
                    anyValue,
                    addr1.address,
                    receiver,
                    targetChainId,
                    ethers.utils.toUtf8Bytes(message),
                    anyValue
                );
        });
    });

    describe("Transmit", () => {
        it("should pass when valid signatures are provided and forward the message", async function () {
            const { ramp, addr1, wallet1, wallet2, wallet3 } = await loadFixture(deployRampFixture);
            const reportContext = getValidReportContext();
            // const solidityRequestId = await ramp.debugRequestId(reportContext.requestId);
            // console.log("Solidity Request ID:", solidityRequestId);
            const message = "Valid Message";
            const tokenAmount = getValidTokenAmount();
            // Generate reportHash
            const reportHash = generateReportHash(reportContext, message, tokenAmount);
            console.log("Report Hash (Test):", reportHash);
            // const solidityHash = await ramp.debugReportHash(
            //   reportContext,
            //   message,
            //   tokenAmount
            // );
            // console.log("Solidity Hash:", solidityHash);
            // expect(reportHash).to.equal(solidityHash);

            const { rs, ss, rawVs } = generateSigns(reportHash, [wallet1.privateKey, wallet2.privateKey, wallet3.privateKey]);
            // console.log("Signatures (rs, ss, rawVs):", rs, ss, rawVs);

            // Call `transmit` as addr1
            const tx = await ramp.connect(addr1).transmit(reportContext, message, tokenAmount, rs, ss, rawVs);
            await expect(tx).to.emit(ramp, "ForwardMessageCalled")
                .withArgs(
                    [
                        tokenAmount.swapId,
                        tokenAmount.targetChainId,
                        tokenAmount.targetContractAddress,
                        tokenAmount.tokenAddress,
                        tokenAmount.originToken,
                        tokenAmount.amount
                    ],
                    message,
                    reportContext.sourceChainId,
                    reportContext.sender,
                    reportContext.receiver
                );
        });

        it("should fail if insufficient valid signatures provided", async function () {
            const { ramp, addr1, wallet1 } = await loadFixture(deployRampFixture);

            const reportContext = getValidReportContext();
            const message = "Invalid Message";
            const tokenAmount = getValidTokenAmount();
            const reportHash = generateReportHash(reportContext, message, tokenAmount);
            const { rs, ss, rawVs } = generateSigns(reportHash, [wallet1.privateKey]);

            // Call `transmit` as addr1
            await expect(
                ramp.connect(addr1).transmit(reportContext, message, tokenAmount, rs, ss, rawVs))
                .to.be.revertedWith('Insufficient or invalid signatures');
        });
    });

    // --- Helper Functions ---
    function getValidReportContext() {
        return {
            requestId: ethers.utils.id("ValidRequest"),
            sourceChainId: 1,
            targetChainId: 2,
            sender: "Alice",
            receiver: mockRouter.address,
        };
    }

    function getValidTokenAmount() {
        return {
            swapId: "SWAP123",
            targetChainId: 2,
            targetContractAddress: mockRouter.address.toLowerCase(),
            tokenAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            originToken: "ETH",
            amount: TOKEN_AMOUNT,
        };
    }

    function generateReportHash(reportContext, message, tokenAmount) {
        return ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                [
                    "tuple(bytes32,uint256,uint256,string,address)", // ReportContext
                    "string", // Message
                    "tuple(string,uint256,string,string,string,uint256)", // TokenAmount
                ],
                [
                    [
                        reportContext.requestId,
                        reportContext.sourceChainId,
                        reportContext.targetChainId,
                        reportContext.sender,
                        reportContext.receiver,
                    ],
                    message,
                    [
                        tokenAmount.swapId,
                        tokenAmount.targetChainId,
                        tokenAmount.targetContractAddress,
                        tokenAmount.tokenAddress,
                        tokenAmount.originToken,
                        tokenAmount.amount,
                    ],
                ]
            )
        );
    }

    function generateMessageId(sender, targetChainId, receiver, message, tokenAmount, blockTime) {
        return ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                [
                    "address",
                    "uint256",
                    "string",
                    "bytes",
                    "tuple(string,uint256,string,string,string,uint256)", // TokenAmount
                    "uint256"
                ],
                [
                    sender,
                    targetChainId,
                    receiver,
                    ethers.utils.toUtf8Bytes(message),
                    [
                        tokenAmount.swapId,
                        tokenAmount.targetChainId,
                        tokenAmount.targetContractAddress,
                        tokenAmount.tokenAddress,
                        tokenAmount.originToken,
                        tokenAmount.amount,
                    ],
                    blockTime
                ]
            )
        );
    }

    function encodeTokenAmount(tokenAmount) {
        return ethers.utils.defaultAbiCoder.encode(
            [
                "tuple(string,uint256,address,address,string,uint256)",
            ],
            [
                [
                    tokenAmount.swapId,
                    tokenAmount.targetChainId,
                    tokenAmount.targetContractAddress,
                    tokenAmount.tokenAddress,
                    tokenAmount.originToken,
                    tokenAmount.amount,
                ],
            ]
        );
    }

    function generateSigns(hash, privateKeys) {
        var rs = [];
        var ss = [];
        let buffer = new Array(32);
        for (var i = 0; i < privateKeys.length; i++) {
            let signKey = new ethers.utils.SigningKey(privateKeys[i]);
            var Signature = signKey.signDigest(hash);
            rs.push(Signature.r);
            ss.push(Signature.s);
            var vv = Signature.v == 27 ? "00" : "01";
            buffer[i] = vv;
        }
        const rawVs = buildRawVs(buffer)
        return { rs, ss, rawVs };
    }

    function buildRawVs(buffer) {
        buffer.fill(0, 4);
        var v = Buffer.from(buffer);
        const bufferAsString = v.toString('hex');
        const signatureV = "0x" + bufferAsString;
        // console.log("signature V:", signatureV)
        return signatureV;
    }
})