// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./IXcm.sol";
import "./IntentBox.sol";
import "./SolverRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SettlementEngine is Ownable {
    IntentBox       public immutable intentBox;
    SolverRegistry  public immutable registry;
    IXcm            public immutable xcmPrecompile;

    event IntentSettled(bytes32 indexed intentId, address indexed solver);
    event XCMDispatched(bytes32 indexed intentId, bytes xcmMessage);

    constructor(address _intentBox, address _registry) Ownable(msg.sender) {
        intentBox    = IntentBox(_intentBox);
        registry     = SolverRegistry(_registry);
        xcmPrecompile = IXcm(XCM_PRECOMPILE_ADDRESS);
    }

    /**
     * Called by a solver after they have pre-funded the destination chain.
     * They submit:
     *   - intentId:   the intent they're filling
     *   - xcmMessage: SCALE-encoded XCM program (WithdrawAsset→BuyExecution→DepositAsset)
     *
     * The contract:
     *   1. Validates the intent is still open
     *   2. Verifies the solver is registered
     *   3. Calls the XCM precompile to dispatch the transfer
     *   4. Marks the intent as filled
     *   5. Queues the solver's fee payout (released after 30-min dispute window)
     */
    function settleIntent(bytes32 intentId, bytes calldata xcmMessage) external {
        IntentBox.Intent memory intent = intentBox.getIntent(intentId);

        require(intent.status == IntentBox.IntentStatus.OPEN, "Intent not open");
        require(block.timestamp <= intent.deadline, "Intent expired");
        require(registry.isSolverActive(msg.sender), "Not a registered solver");

        // ── Step 1: Estimate weight ──
        IXcm.Weight memory weight = xcmPrecompile.weighMessage(xcmMessage);

        // ── Step 2: Execute XCM (dispatches cross-chain transfer) ──
        xcmPrecompile.execute(xcmMessage, weight);
        emit XCMDispatched(intentId, xcmMessage);

        // ── Step 3: Mark intent filled ──
        intentBox.markFilled(intentId, msg.sender);

        // ── Step 4: Queue solver fee (locked for 30-min dispute window) ──
        registry.queuePayout(msg.sender, intentId, intent.maxFee);

        emit IntentSettled(intentId, msg.sender);
    }

    /**
     * Testnet-only settlement that skips XCM precompile.
     * Use this for hackathon demos where cross-chain XCM isn't available.
     */
    function settleIntentTestnet(bytes32 intentId) external {
        IntentBox.Intent memory intent = intentBox.getIntent(intentId);

        require(intent.status == IntentBox.IntentStatus.OPEN, "Intent not open");
        require(block.timestamp <= intent.deadline, "Intent expired");
        require(registry.isSolverActive(msg.sender), "Not a registered solver");

        // Skip XCM — mark intent filled directly
        intentBox.markFilled(intentId, msg.sender);
        registry.queuePayout(msg.sender, intentId, intent.maxFee);

        emit IntentSettled(intentId, msg.sender);
    }
}
