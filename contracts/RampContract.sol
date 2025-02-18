// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./interfaces/RampInterface.sol";
import "./interfaces/RouterInterface.sol";
// import "hardhat/console.sol";

contract Ramp is IRamp {
    address public immutable owner; // Contract owner
    uint256 public threshold; // Min signatures required for consensus
    address[] private oracleNodes;
    mapping(address => bool) private isOracleNode;
    uint256 public signatureThreshold;

    struct ReportContext {
        bytes32 requestId;
        uint256 sourceChainId;
        uint256 targetChainId;
        string sender;
        address receiver;
    }

    constructor(address[] memory initialNodes) {
        owner = msg.sender;
        _updateOracleNodes(initialNodes); // Initialize the oracle node list
    }

    function updateOracleNodes(
        address[] calldata newOracleNodes
    ) external onlyOwner {
        // console.log("Updating oracle nodes..."); // Log message
        _updateOracleNodes(newOracleNodes);
    }

    /// @notice Retrieves the current oracle nodes
    function getOracleNodes() external view returns (address[] memory) {
        return oracleNodes;
    }

    // --- Events ---
    event RequestSent(
        bytes32 indexed messageId,
        address indexed sender,
        string receiver,
        uint256 targetChainId,
        bytes data,
        TokenAmount tokenAmount
    );
    event ReportTransmitted(
        bytes32 indexed requestId,
        address indexed targetContract,
        bytes report
    );
    event OracleNodesUpdated(address[] newOracleNodes, uint256 newThreshold);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        // console.log("Owner check passed:", msg.sender); // Debug owner check
        _;
    }

    modifier onlyOracleNode() {
        require(
            isOracleNode[msg.sender],
            "Caller is not an authorized oracle node"
        );
        // console.log("Oracle check passed for:", msg.sender); // Debug oracle check
        _;
    }

    modifier validThreshold(uint256 _threshold) {
        require(
            _threshold > 0 && _threshold <= oracleNodes.length,
            "Invalid threshold"
        );
        // console.log("Threshold is valid:", _threshold); // Debug threshold
        _;
    }

    function sendRequest(
        uint256 targetChainId,
        string calldata receiver,
        bytes calldata message,
        TokenAmount calldata tokenAmount
    ) external override returns (bytes32 messageId) {
        require(tokenAmount.amount > 0, "Invalid token amount");
        // console.log("sendRequest called with TokenAmount:", tokenAmount.amount); // Debug token amount

        messageId = keccak256(
            abi.encode(
                msg.sender,
                targetChainId,
                receiver,
                message,
                tokenAmount,
                block.timestamp
            )
        );
        // console.logBytes32(messageId); // Log the computed `messageId`

        emit RequestSent(
            messageId,
            msg.sender,
            receiver,
            targetChainId,
            message,
            tokenAmount
        );
    }

    function transmit(
        ReportContext calldata reportContext,
        string calldata message,
        TokenAmount calldata tokenAmount,
        bytes32[] memory rs,
        bytes32[] memory ss,
        bytes32 rawVs
    ) external onlyOracleNode {
        bytes32 reportHash = keccak256(
            abi.encode(reportContext, message, tokenAmount)
        );
        // console.logBytes32(reportHash); // Log the `reportHash`

        require(
            _validateSignatures(reportHash, rs, ss, rawVs),
            "Insufficient or invalid signatures"
        );

        require(
            reportContext.receiver != address(0),
            "Invalid receiver address"
        );
        // console.log("Report successfully processed and forwarded."); // Debug message

        IRouter(reportContext.receiver).forwardMessage(
            tokenAmount,
            message,
            reportContext.sourceChainId,
            reportContext.sender,
            reportContext.receiver
        );

        emit ForwardMessageCalled(
            tokenAmount,
            message,
            reportContext.sourceChainId,
            reportContext.sender,
            reportContext.receiver
        );
    }

    // --- Internal Helpers ---
    function _validateSignatures(
        bytes32 reportHash,
        bytes32[] memory rs,
        bytes32[] memory ss,
        bytes32 rawVs
    ) internal view returns (bool) {
        require(rs.length == ss.length, "Mismatched signature arrays");
        require(rs.length <= oracleNodes.length, "Too many signatures");

        // Track valid signatures
        uint256 validSignatures = 0;

        for (uint256 i = 0; i < rs.length; i++) {
            uint8 v = uint8(rawVs[i]); // Extract normalized `v` value

            // Ensure `v` is valid (27 or 28)
            if (v < 27) v += 27;

            // Recover signer address
            address recovered = ecrecover(reportHash, v, rs[i], ss[i]);
            // console.log("Recovered Address:", recovered); // Log recovered address

            require(recovered != address(0), "Invalid signature: zero address");

            // Ensure recovered signer is an authorized oracle node
            if (isOracleNode[recovered]) {
                validSignatures++;
                // console.log("Valid Oracle Node:", recovered); // Debug valid node
            }
        }

        // Check signature threshold
        // console.log("Valid Signatures:", validSignatures);
        return validSignatures >= signatureThreshold;
    }

    function _updateOracleNodes(address[] memory newOracleNodes) internal {
        // console.log("Clearing current oracle nodes...");
        for (uint256 i = 0; i < oracleNodes.length; i++) {
            isOracleNode[oracleNodes[i]] = false;
        }
        delete oracleNodes;

        for (uint256 j = 0; j < newOracleNodes.length; j++) {
            require(newOracleNodes[j] != address(0), "Invalid node address");
            require(!isOracleNode[newOracleNodes[j]], "Duplicate node address");

            // console.log("Adding new node:", newOracleNodes[j]); // Log new node addition
            oracleNodes.push(newOracleNodes[j]);
            isOracleNode[newOracleNodes[j]] = true;
        }

        signatureThreshold = (oracleNodes.length + 1) / 2 + 1;
        // console.log("Updated signature threshold:", signatureThreshold); // Debug threshold update
    }

    // for debug
    // function debugReportHash(
    //     ReportContext memory reportContext,
    //     string memory message,
    //     TokenAmount memory tokenAmount
    // ) public pure returns (bytes32) {
    //     return keccak256(abi.encode(reportContext, message, tokenAmount));
    // }

    // function debugRequestId(bytes32 requestId) public pure returns (bytes32) {
    //     return requestId;
    // }
}
