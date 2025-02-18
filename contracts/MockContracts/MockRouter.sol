// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../interfaces/RampInterface.sol";
import "../interfaces/RouterInterface.sol";

contract MockRouter is IRouter {
    function forwardMessage(
        IRamp.TokenAmount calldata tokenAmount,
        string calldata message,
        uint256 sourceChainId,
        string calldata sender,
        address receiver
    ) external override {}
}
