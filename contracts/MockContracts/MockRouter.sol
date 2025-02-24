pragma solidity ^0.8.9;

import "../interfaces/RampInterface.sol";
import "../interfaces/RouterInterface.sol";

contract MockRouter is IRouter {
    event MockRouterDeployed(address indexed routerAddress);

    constructor() {
        emit MockRouterDeployed(address(this));
    }

    function forwardMessage(
        IRamp.TokenAmount calldata tokenAmount,
        bytes calldata message,
        uint256 sourceChainId,
        string calldata sender,
        address receiver
    ) external override {}
}
