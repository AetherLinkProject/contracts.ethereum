import "./RampInterface.sol";

interface IRouter {
    function forwardMessage(
        IRamp.TokenAmount memory tokenAmount,
        string memory message,
        uint256 sourceChainId,
        string memory sender,
        address receiver
    ) external;
}
