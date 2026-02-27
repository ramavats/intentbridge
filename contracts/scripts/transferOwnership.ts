import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const polkadotHubTestnet = defineChain({
    id: 420420417,
    name: "Polkadot Hub TestNet",
    nativeCurrency: { decimals: 18, name: "PAS", symbol: "PAS" },
    rpcUrls: {
        default: { http: ["https://services.polkadothub-rpc.com/testnet"] },
    },
});

// Using the same key as the solver (from solver/.env)
const account = privateKeyToAccount("0x09fcf196293bbaa2e855217d54c0f0ed8d76030a527f14821ca6e5d66bbe9497");

const publicClient = createPublicClient({
    chain: polkadotHubTestnet,
    transport: http(),
});

const walletClient = createWalletClient({
    account,
    chain: polkadotHubTestnet,
    transport: http(),
});

const registryAddress = "0x29812e5f7EBd1C9A7DE1c67630909ba3E4Ed9e0e";
const settlementAddress = "0xDC8feF64C2271C5EcC1d6c613CDae8660D481f66";

const abi = [
    {
        name: "transferOwnership",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "newOwner", type: "address" }],
        outputs: [],
    },
    {
        name: "owner",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
    },
];

async function main() {
    console.log(`Wallet: ${account.address}`);

    const currentOwner = await publicClient.readContract({
        address: registryAddress,
        abi,
        functionName: "owner",
    });
    console.log(`Current SolverRegistry owner: ${currentOwner}`);

    console.log(`Transferring ownership to SettlementEngine (${settlementAddress})...`);
    const hash = await walletClient.writeContract({
        address: registryAddress,
        abi,
        functionName: "transferOwnership",
        args: [settlementAddress],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Ownership transferred! TX: ${hash}`);
    console.log(`   Block: ${receipt.blockNumber}`);
}

main().catch(console.error);
