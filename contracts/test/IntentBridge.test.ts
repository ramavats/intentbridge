import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther, zeroAddress } from "viem";

describe("IntentBridge", async function () {
    const { viem } = await network.connect();

    let intentBox: any;
    let registry: any;
    let settlement: any;

    beforeEach(async () => {
        intentBox = await viem.deployContract("IntentBox");
        registry = await viem.deployContract("SolverRegistry");
        settlement = await viem.deployContract("SettlementEngine", [
            intentBox.address,
            registry.address,
        ]);
    });

    it("should allow a user to submit an intent", async () => {
        const walletClients = await viem.getWalletClients();
        const user = walletClients[1];

        const hash = await intentBox.write.submitIntent(
            [
                2000,                       // toChainId (e.g., Hydration)
                zeroAddress,                // native token in
                zeroAddress,                // native token out
                parseEther("0.09"),         // minAmountOut
                600,                        // 10 min TTL
                parseEther("0.01"),         // maxFee
            ],
            {
                value: parseEther("0.1"),
                account: user.account,
            }
        );
        const publicClient = await viem.getPublicClient();
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        assert.equal(receipt.status, "success");
    });

    it("should register a solver with sufficient bond", async () => {
        const walletClients = await viem.getWalletClients();
        const solver = walletClients[2];

        await registry.write.registerSolver({
            value: parseEther("0.1"),
            account: solver.account,
        });
        const isActive = await registry.read.isSolverActive([solver.account.address]);
        assert.equal(isActive, true);
    });

    it("should reject solver registration below minimum bond", async () => {
        const walletClients = await viem.getWalletClients();
        const solver = walletClients[2];

        await assert.rejects(
            async () => {
                await registry.write.registerSolver({
                    value: parseEther("0.01"),
                    account: solver.account,
                });
            },
        );
    });
});
