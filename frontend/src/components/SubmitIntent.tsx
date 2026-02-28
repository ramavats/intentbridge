"use client";
import { useState, useEffect } from "react";
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
    {
        id: "2034",
        name: "Hydration",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
        ),
    },
    {
        id: "2004",
        name: "Moonbeam",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        ),
    },
    {
        id: "2006",
        name: "Astar",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    },
    {
        id: "2030",
        name: "Bifrost",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 17a10 10 0 0 0-20 0" /><path d="M6 17a6 6 0 0 1 12 0" /><path d="M10 17a2 2 0 0 1 4 0" />
            </svg>
        ),
    },
];

export function SubmitIntent() {
    const [mounted, setMounted] = useState(false);
    const { isConnected } = useAccount();
    const [amount, setAmount] = useState("0.1");
    const [minOut, setMinOut] = useState("0.09");
    const [maxFee, setMaxFee] = useState("0.01");
    const [toChain, setToChain] = useState("2034");

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } =
        useWaitForTransactionReceipt({ hash });
    useEffect(() => setMounted(true), []);

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

    if (!mounted || !isConnected) {
        return (
            <div className="glass-card rounded-2xl p-4 sm:p-6 glow-warm animate-fade-in-up h-full flex flex-col justify-center">
                <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FFECD1]/20 to-[#ff6b35]/20 flex items-center justify-center border border-[#FFECD1]/15">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFECD1]">
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
        <div className="glass-card rounded-2xl p-4 sm:p-6 glow-warm animate-fade-in-up h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFECD1] to-[#ff6b35] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3E000C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-base font-bold text-foreground">New Intent</h2>
                    <p className="text-xs text-muted-foreground">Bridge assets cross-chain</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
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
                        className="input-field w-full px-4 py-3 rounded-xl text-lg font-semibold"
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
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200
                  ${toChain === chain.id
                                        ? "bg-[#FFECD1]/10 border-[#FFECD1]/40 text-[#FFECD1] shadow-[0_0_12px_rgba(255,236,209,0.08)]"
                                        : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    } border`}
                            >
                                {chain.icon}
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
                            className="input-field w-full px-3 py-2.5 rounded-xl text-sm font-medium"
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
                            className="input-field w-full px-3 py-2.5 rounded-xl text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isPending || isConfirming}
                    className="btn-gradient w-full py-3 sm:py-3.5 rounded-xl text-sm tracking-wide mt-2"
                >
                    {isPending
                        ? "Approve in Wallet…"
                        : isConfirming
                            ? "Confirming…"
                            : "Submit Intent"}
                </button>
            </div>

            {/* Status Messages */}
            {hash && (
                <div className="mt-4 p-3 sm:p-4 rounded-xl bg-[#FFECD1]/5 border border-[#FFECD1]/15">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#FFECD1]/10 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFECD1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Transaction Hash</p>
                            <a
                                href={`https://polkadot.testnet.routescan.io/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-[#FFECD1] hover:text-[#fff3e0] transition-colors truncate block"
                            >
                                {hash.slice(0, 16)}…{hash.slice(-10)}
                            </a>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFECD1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-40">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </div>
                </div>
            )}
            {isSuccess && (
                <div className="mt-3 p-3 sm:p-4 rounded-xl bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-success/10 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <p className="text-sm text-success font-medium">
                            Intent submitted successfully
                        </p>
                    </div>
                </div>
            )}
            {error && (
                <div className="mt-3 p-3 sm:p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                        <p className="text-sm text-destructive">
                            {error.message.slice(0, 80)}…
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
