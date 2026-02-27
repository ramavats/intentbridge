// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract IntentBox is ReentrancyGuard {
    // ─────────── Data Structures ───────────
    enum IntentStatus { OPEN, FILLED, CANCELLED, EXPIRED }

    struct Intent {
        address user;
        uint32  fromChainId;
        uint32  toChainId;
        address assetIn;         // address(0) = native token
        address assetOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;        // block.timestamp + ttl
        uint256 maxFee;          // max solver reward (in wei)
        IntentStatus status;
    }

    // ─────────── State ───────────
    mapping(bytes32 => Intent) public intents;
    mapping(bytes32 => address) public intentSolver;  // who filled it

    uint256 public intentCount;

    // ─────────── Events ───────────
    event IntentSubmitted(bytes32 indexed intentId, address indexed user, uint256 amountIn);
    event IntentCancelled(bytes32 indexed intentId);

    // ─────────── Submit ───────────
    function submitIntent(
        uint32  toChainId,
        address assetIn,
        address assetOut,
        uint256 minAmountOut,
        uint256 ttlSeconds,
        uint256 maxFee
    ) external payable nonReentrant returns (bytes32 intentId) {
        require(msg.value > 0 && msg.value == msg.value, "Send native token");
        require(maxFee < msg.value, "Fee exceeds deposit");
        require(ttlSeconds > 0 && ttlSeconds <= 3600, "TTL: 1s-1h");

        intentId = keccak256(abi.encodePacked(
            msg.sender, block.chainid, toChainId, assetIn, assetOut,
            msg.value, minAmountOut, block.timestamp, intentCount++
        ));

        intents[intentId] = Intent({
            user: msg.sender,
            fromChainId: uint32(block.chainid),
            toChainId: toChainId,
            assetIn: assetIn,
            assetOut: assetOut,
            amountIn: msg.value,
            minAmountOut: minAmountOut,
            deadline: block.timestamp + ttlSeconds,
            maxFee: maxFee,
            status: IntentStatus.OPEN
        });

        emit IntentSubmitted(intentId, msg.sender, msg.value);
    }

    // ─────────── Cancel (user reclaims if unfilled) ───────────
    function cancelIntent(bytes32 intentId) external nonReentrant {
        Intent storage intent = intents[intentId];
        require(intent.user == msg.sender, "Not your intent");
        require(intent.status == IntentStatus.OPEN, "Not open");
        require(block.timestamp > intent.deadline, "Not expired yet");

        intent.status = IntentStatus.CANCELLED;
        payable(msg.sender).transfer(intent.amountIn);
        emit IntentCancelled(intentId);
    }

    // ─────────── Mark Filled (called by SettlementEngine) ───────────
    function markFilled(bytes32 intentId, address solver) external {
        // In production: add access control so only SettlementEngine can call this
        Intent storage intent = intents[intentId];
        require(intent.status == IntentStatus.OPEN, "Not open");
        intent.status = IntentStatus.FILLED;
        intentSolver[intentId] = solver;
    }

    function getIntent(bytes32 intentId) external view returns (Intent memory) {
        return intents[intentId];
    }
}
