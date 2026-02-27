// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

contract SolverRegistry is Ownable {
    uint256 public constant MIN_BOND = 0.1 ether;   // adjust for testnet
    uint256 public constant DISPUTE_WINDOW = 30 minutes;

    struct Solver {
        uint256 bondAmount;
        uint256 filledCount;
        uint256 slashCount;
        bool    active;
    }

    struct PendingPayout {
        uint256 amount;
        uint256 availableAt;   // timestamp after dispute window
    }

    mapping(address => Solver)        public solvers;
    mapping(bytes32 => PendingPayout) public pendingPayouts;  // intentId → payout

    event SolverRegistered(address indexed solver, uint256 bond);
    event SolverSlashed(address indexed solver, bytes32 intentId, uint256 amount);
    event PayoutQueued(address indexed solver, bytes32 intentId, uint256 amount);
    event PayoutClaimed(address indexed solver, bytes32 intentId, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function registerSolver() external payable {
        require(msg.value >= MIN_BOND, "Bond too low");
        require(!solvers[msg.sender].active, "Already registered");
        solvers[msg.sender] = Solver({
            bondAmount: msg.value,
            filledCount: 0,
            slashCount: 0,
            active: true
        });
        emit SolverRegistered(msg.sender, msg.value);
    }

    function queuePayout(address solver, bytes32 intentId, uint256 feeAmount) external onlyOwner {
        require(solvers[solver].active, "Not a solver");
        pendingPayouts[intentId] = PendingPayout({
            amount: feeAmount,
            availableAt: block.timestamp + DISPUTE_WINDOW
        });
        solvers[solver].filledCount++;
        emit PayoutQueued(solver, intentId, feeAmount);
    }

    function claimPayout(bytes32 intentId) external {
        PendingPayout storage payout = pendingPayouts[intentId];
        require(payout.amount > 0, "No payout");
        require(block.timestamp >= payout.availableAt, "Still in dispute window");
        uint256 amount = payout.amount;
        payout.amount = 0;
        payable(msg.sender).transfer(amount);
        emit PayoutClaimed(msg.sender, intentId, amount);
    }

    function slashSolver(address solver, bytes32 intentId) external onlyOwner {
        Solver storage s = solvers[solver];
        require(s.active, "Not a solver");
        uint256 slashAmount = s.bondAmount;
        s.bondAmount = 0;
        s.active = false;
        s.slashCount++;
        pendingPayouts[intentId].amount = 0;   // cancel queued payout
        emit SolverSlashed(solver, intentId, slashAmount);
        // Slashed funds go to protocol treasury or challenger (extend here)
    }

    function isSolverActive(address solver) external view returns (bool) {
        return solvers[solver].active;
    }
}
