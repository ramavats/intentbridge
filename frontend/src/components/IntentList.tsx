"use client";
import { useEffect, useState } from "react";
import { createPublicClient, http, formatEther } from "viem";

const INTENT_BOX_ADDRESS =
    "0x40D80d465c244B4622dF362fE6c6c6b1F5A61B73" as `0x${string}`;

const polkadotHubTestnet = {
    id: 420420417,
    name: "Polkadot Hub TestNet",
    network: "polkadot-hub-testnet",
    nativeCurrency: { decimals: 18, name: "PAS", symbol: "PAS" },
    rpcUrls: {
        default: {
            http: ["https://services.polkadothub-rpc.com/testnet"],
        },
    },
};

interface IntentEvent {
    intentId: string;
    user: string;
    amountIn: bigint;
    blockNumber: bigint;
}

export function IntentList() {
    const [intents, setIntents] = useState<IntentEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const client = createPublicClient({
            chain: polkadotHubTestnet as any,
            transport: http(),
        });

        const fetchLogs = async () => {
            try {
                const blockNumber = await client.getBlockNumber();
                const fromBlock = blockNumber > 5000n ? blockNumber - 5000n : 0n;

                const logs = await client.getLogs({
                    address: INTENT_BOX_ADDRESS,
                    event: {
                        name: "IntentSubmitted",
                        type: "event",
                        inputs: [
                            { name: "intentId", type: "bytes32", indexed: true },
                            { name: "user", type: "address", indexed: true },
                            { name: "amountIn", type: "uint256", indexed: false },
                        ],
                    },
                    fromBlock,
                });

                setIntents(
                    logs
                        .map((l) => ({
                            intentId: l.args.intentId as string,
                            user: l.args.user as string,
                            amountIn: l.args.amountIn as bigint,
                            blockNumber: l.blockNumber,
                        }))
                        .reverse()
                );
            } catch (err: any) {
                setError("Failed to fetch intents");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-card rounded-2xl p-6 glow-pink animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Recent Intents</h2>
                        <p className="text-xs text-muted-foreground">Live activity feed</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-success status-pulse" />
                    <span className="text-[10px] font-medium text-success uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl p-4 bg-secondary/30">
                            <div className="shimmer h-3 w-32 rounded mb-3" />
                            <div className="shimmer h-3 w-48 rounded mb-2" />
                            <div className="shimmer h-3 w-24 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && intents.length === 0 && (
                <div className="text-center py-10">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12h8M12 8v8" />
                        </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">No intents yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                        Submit one to get started
                    </p>
                </div>
            )}

            {/* Intent Cards */}
            {!loading && intents.length > 0 && (
                <div className="space-y-2.5">
                    {intents.map((intent, i) => (
                        <div
                            key={i}
                            className="group relative rounded-xl p-4 border border-border/50
                         bg-secondary/20 hover:bg-secondary/40 hover:border-purple-500/20
                         transition-all duration-300"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Intent ID */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                                            <span className="text-[10px] font-mono text-purple-400">
                                                {intent.intentId?.slice(0, 10)}…
                                            </span>
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60">
                                            Block #{intent.blockNumber?.toString()}
                                        </span>
                                    </div>

                                    {/* User */}
                                    <p className="text-xs text-muted-foreground mb-1">
                                        <span className="text-muted-foreground/60">From </span>
                                        <span className="font-mono">
                                            {intent.user?.slice(0, 8)}…{intent.user?.slice(-4)}
                                        </span>
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground">
                                        {intent.amountIn
                                            ? parseFloat(formatEther(intent.amountIn)).toFixed(4)
                                            : "?"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        PAS
                                    </p>
                                </div>
                            </div>

                            {/* Hover indicator */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 group-hover:h-8 transition-all duration-300" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
