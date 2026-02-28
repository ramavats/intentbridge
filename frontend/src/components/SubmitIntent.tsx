"use client";
import { useState } from "react";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
} from "wagmi";
import { parseEther } from "viem";

const INTENT_BOX_ADDRESS =
    "0x40D80d465c244B4622dF362fE6c6c6b1F5A61B73" as `0x${string}`;

const INTENT_BOX_ABI = [
    {
        name: "submitIntent",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "toChainId", type: "uint32" },
            { name: "assetIn", type: "address" },
            { name: "assetOut", type: "address" },
            { name: "minAmountOut", type: "uint256" },
            { name: "ttlSeconds", type: "uint256" },
            { name: "maxFee", type: "uint256" },
        ],
        outputs: [{ name: "intentId", type: "bytes32" }],
    },
];

const CHAINS = [
    { id: "2034", name: "Hydration", icon: "🌊" },
    { id: "2004", name: "Moonbeam", icon: "🌙" },
    { id: "2006", name: "Astar", icon: "⭐" },
    { id: "2030", name: "Bifrost", icon: "🌈" },
];

export function SubmitIntent() {
    const { isConnected } = useAccount();
    const [amount, setAmount] = useState("0.1");
    const [minOut, setMinOut] = useState("0.09");
    const [maxFee, setMaxFee] = useState("0.01");
    const [toChain, setToChain] = useState("2034");

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } =
        useWaitForTransactionReceipt({ hash });

    const handleSubmit = () => {
        writeContract({
            address: INTENT_BOX_ADDRESS,
            abi: INTENT_BOX_ABI,
            functionName: "submitIntent",
            args: [
                Number(toChain),
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                parseEther(minOut),
                BigInt(600),
                parseEther(maxFee),
            ],
            value: parseEther(amount),
        });
    };

    if (!isConnected) {
        return (
            <div className="glass-card rounded-2xl p-8 glow-purple animate-fade-in-up">
                <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Connect your wallet to start bridging
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-2xl p-6 glow-purple animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-base font-bold text-foreground">New Intent</h2>
                    <p className="text-xs text-muted-foreground">Bridge assets cross-chain</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Amount */}
                <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            You Send
                        </label>
                        <span className="text-xs text-muted-foreground">PAS</span>
                    </div>
                    <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="text"
                        placeholder="0.0"
                        className="input-field w-full px-4 py-3 rounded-xl text-foreground text-lg font-semibold
                       placeholder:text-muted-foreground/40"
                    />
                </div>

                {/* Destination Chain */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Destination
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {CHAINS.map((chain) => (
                            <button
                                key={chain.id}
                                onClick={() => setToChain(chain.id)}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${toChain === chain.id
                                        ? "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                                        : "bg-secondary/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                    } border`}
                            >
                                <span className="mr-1.5">{chain.icon}</span>
                                {chain.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Min Out & Max Fee */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                            Min Output
                        </label>
                        <input
                            value={minOut}
                            onChange={(e) => setMinOut(e.target.value)}
                            type="text"
                            className="input-field w-full px-3 py-2.5 rounded-xl text-foreground text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                            Max Fee
                        </label>
                        <input
                            value={maxFee}
                            onChange={(e) => setMaxFee(e.target.value)}
                            type="text"
                            className="input-field w-full px-3 py-2.5 rounded-xl text-foreground text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isPending || isConfirming}
                    className="btn-gradient w-full py-3.5 rounded-xl text-white font-bold text-sm
                     tracking-wide mt-2"
                >
                    {isPending
                        ? "⏳ Approve in Wallet…"
                        : isConfirming
                            ? "⏳ Confirming…"
                            : "Submit Intent →"}
                </button>
            </div>

            {/* Status Messages */}
            {hash && (
                <div className="mt-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <p className="text-xs text-muted-foreground break-all">
                        TX:{" "}
                        <a
                            href={`https://420420417.testnet.routescan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            {hash.slice(0, 20)}…{hash.slice(-8)}
                        </a>
                    </p>
                </div>
            )}
            {isSuccess && (
                <div className="mt-3 p-3 rounded-xl bg-success/5 border border-success/20">
                    <p className="text-sm text-success font-medium">
                        ✅ Intent submitted successfully!
                    </p>
                </div>
            )}
            {error && (
                <div className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                    <p className="text-sm text-destructive">
                        ✕ {error.message.slice(0, 80)}…
                    </p>
                </div>
            )}
        </div>
    );
}
