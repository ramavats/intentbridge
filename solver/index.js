import 'dotenv/config';
import { ethers } from 'ethers';

// ── Provider using polling (no eth_newFilter needed) ──
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, {
    chainId: Number(process.env.CHAIN_ID),
    name: 'polkadot-hub-testnet'
}, {
    polling: true,
    pollingInterval: 4000   // check every 4 seconds
});

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log(`🤖 Solver wallet: ${wallet.address}`);

// ── ABIs ──
const INTENT_BOX_ABI = [
    "event IntentSubmitted(bytes32 indexed intentId, address indexed user, uint256 amountIn)",
    "function getIntent(bytes32 intentId) view returns (tuple(address user, uint32 fromChainId, uint32 toChainId, address assetIn, address assetOut, uint256 amountIn, uint256 minAmountOut, uint256 deadline, uint256 maxFee, uint8 status))"
];

const REGISTRY_ABI = [
    "function registerSolver() external payable",
    "function solvers(address) view returns (uint256 bondAmount, uint256 filledCount, uint256 slashCount, bool active)",
    "function claimPayout(bytes32 intentId) external",
    "function MIN_BOND() view returns (uint256)"
];

const SETTLEMENT_ABI = [
    "function settleIntentTestnet(bytes32 intentId) external"
];

// ── Contract Instances ──
const intentBox = new ethers.Contract(process.env.INTENT_BOX_ADDRESS, INTENT_BOX_ABI, wallet);
const registry = new ethers.Contract(process.env.REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
const settlement = new ethers.Contract(process.env.SETTLEMENT_ADDRESS, SETTLEMENT_ABI, wallet);

// ── Track processed intents to avoid double-filling ──
const processedIntents = new Set();

// ── XCM Message Builder ──
function buildXcmMessage(intent) {
    console.log(`   Building XCM route: Chain ${intent.fromChainId} → Chain ${intent.toChainId}`);
    return "0x0408000100000700e40b5402000100010300c91f";  // MVP placeholder
}

// ── Register as Solver ──
async function ensureRegistered() {
    const solverInfo = await registry.solvers(wallet.address);
    if (solverInfo.active) {
        console.log(`✅ Already registered. Bond: ${ethers.formatEther(solverInfo.bondAmount)} PAS`);
        return;
    }
    console.log("📋 Registering as solver...");
    const minBond = await registry.MIN_BOND();
    const tx = await registry.registerSolver({ value: minBond });
    await tx.wait();
    console.log(`✅ Registered! Bond: ${ethers.formatEther(minBond)} PAS`);
}

// ── Fill an Intent ──
async function fillIntent(intentId) {
    if (processedIntents.has(intentId)) return;
    processedIntents.add(intentId);

    console.log(`\n⚡ Attempting to fill intent: ${intentId.slice(0, 12)}...`);

    const intent = await intentBox.getIntent(intentId);
    if (Number(intent.status) !== 0) {
        console.log(`⏭️  Skipping — not OPEN (status: ${intent.status})`);
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > Number(intent.deadline)) {
        console.log(`⏰ Skipping — expired`);
        return;
    }

    console.log(`   User: ${intent.user}`);
    console.log(`   Amount: ${ethers.formatEther(intent.amountIn)} PAS`);
    console.log(`   Max fee: ${ethers.formatEther(intent.maxFee)} PAS`);

    const xcmMessage = buildXcmMessage(intent);

    try {
        const tx = await settlement.settleIntentTestnet(intentId);
        console.log(`   📡 TX sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`   ✅ Filled! Block: ${receipt.blockNumber}`);

        // Schedule payout claim after 31 minutes
        setTimeout(async () => {
            try {
                const claimTx = await registry.claimPayout(intentId);
                await claimTx.wait();
                console.log(`\n💸 Payout claimed for ${intentId.slice(0, 12)}...`);
            } catch (e) {
                console.error(`❌ Payout claim failed: ${e.message}`);
            }
        }, 31 * 60 * 1000);

    } catch (err) {
        console.error(`❌ Failed to fill ${intentId.slice(0, 12)}...: ${err.message}`);
        processedIntents.delete(intentId); // allow retry
    }
}

// ── Poll for new intents by scanning new blocks ──
async function pollForIntents(fromBlock) {
    try {
        const currentBlock = await provider.getBlockNumber();
        if (currentBlock < fromBlock) return fromBlock;

        const logs = await provider.getLogs({
            address: process.env.INTENT_BOX_ADDRESS,
            topics: [ethers.id("IntentSubmitted(bytes32,address,uint256)")],
            fromBlock: fromBlock,
            toBlock: currentBlock
        });

        for (const log of logs) {
            const parsed = intentBox.interface.parseLog(log);
            if (parsed) {
                console.log(`\n📥 Intent found in block ${log.blockNumber}!`);
                await fillIntent(parsed.args.intentId);
            }
        }

        return currentBlock + 1;  // next poll starts from next block
    } catch (err) {
        console.error(`⚠️  Poll error: ${err.message}`);
        return fromBlock;  // retry same block range
    }
}

// ── Main ──
async function main() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚡ IntentBridge Solver Bot (polling mode)");
    console.log(`   IntentBox:        ${process.env.INTENT_BOX_ADDRESS}`);
    console.log(`   SettlementEngine: ${process.env.SETTLEMENT_ADDRESS}`);
    console.log(`   SolverRegistry:   ${process.env.REGISTRY_ADDRESS}`);
    console.log(`   Pathfinder (PVM): 0x7013DC4df91c1A8f0D33d6D6F44310e1565FBb5c`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await ensureRegistered();

    // Start scanning from 1000 blocks ago to catch any missed intents
    const startBlock = Math.max(0, (await provider.getBlockNumber()) - 1000);
    console.log(`\n👂 Polling for intents from block ${startBlock}...\n`);

    let nextBlock = startBlock;
    while (true) {
        nextBlock = await pollForIntents(nextBlock);
        await new Promise(r => setTimeout(r, 4000));  // poll every 4 seconds
    }
}

main().catch(console.error);
