const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ramp Contract", function () {
  let Ramp, ramp, owner, addr2, mockRouter;
  let wallet1, wallet2, wallet3;
  const TOKEN_AMOUNT = ethers.utils.parseEther("100"); // Fixed token amount used across tests

  beforeEach(async function () {
    // Deploy Ramp Contract
    Ramp = await ethers.getContractFactory("Ramp");
    [owner, addr1, addr2] = await ethers.getSigners();
    wallet1 = new ethers.Wallet("59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    wallet2 = new ethers.Wallet("5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
    wallet3 = new ethers.Wallet("7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6");
    // wallet4 = new ethers.Wallet("47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a");
    // 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 
    // 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, 
    // 0x90F79bf6EB2c4f870365E785982E1f101E93b906

    // Initialize with initial oracle nodes
    const initialOracleNodes = [wallet1.address, wallet2.address, wallet3.address];
    // console.log(`initialOracleNodes: ${initialOracleNodes}`)
    ramp = await Ramp.deploy(initialOracleNodes);

    // Deploy MockRouter
    const RouterMock = await ethers.getContractFactory("MockRouter");
    mockRouter = await RouterMock.deploy();
    await mockRouter.deployed();
  });

  // --- Initial State Tests ---
  describe("Initial State", () => {
    it("should set the owner correctly", async () => {
      expect(await ramp.owner()).to.equal(owner.address);
    });

    it("should initialize oracle nodes correctly", async () => {
      const oracleNodes = await ramp.getOracleNodes();
      expect(oracleNodes.length).to.equal(3);
      expect(oracleNodes).to.include(addr1.address);
      expect(oracleNodes).to.include(addr2.address);
    });

    it("should calculate the correct signature threshold", async () => {
      const expectedThreshold = Math.floor((3 + 1) / 2) + 1; // Threshold = 2 when 3 nodes exist
      expect(await ramp.signatureThreshold()).to.equal(expectedThreshold);
    });
  });

  // --- Transmit Tests ---
  describe("Transmit", () => {
    it("should pass when valid signatures are provided and forward the message", async function () {
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
      tokenAddress: "0xTOKEN123".toLowerCase(),
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

  async function generateSignatures(hash, signers) {
    const signatures = [];
    for (const signer of signers) {
      const signature = await signer.signMessage(ethers.utils.arrayify(hash)); // Sign the hash
      const { r, s, v } = ethers.utils.splitSignature(signature); // Split the signature
      signatures.push({ r, s, v });
    }
    return signatures;
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
    // console.log(buffer);
    buffer.fill(0, 4);
    var v = Buffer.from(buffer);
    const bufferAsString = v.toString('hex');
    const signatureV = "0x" + bufferAsString;
    // console.log("signature V:", signatureV)
    return signatureV;
  }
});