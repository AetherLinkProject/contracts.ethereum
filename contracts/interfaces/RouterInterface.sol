pragma solidity ^0.8.9;
import "./RampInterface.sol";

interface IRouter {
    function forwardMessage(
        IRamp.TokenAmount memory tokenAmount,
        bytes memory message,
        uint256 sourceChainId,
        string memory sender,
        address receiver
    ) external;
}
