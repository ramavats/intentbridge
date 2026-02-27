"use client";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function ConnectWallet() {
    const { connect } = useConnect();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    if (isConnected)
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl glass-card">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-sm font-mono text-foreground">
                        {address?.slice(0, 6)}…{address?.slice(-4)}
                    </span>
                </div>
                <button
                    onClick={() => disconnect()}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground
                     hover:text-destructive hover:bg-destructive/10 transition-all duration-200
                     border border-transparent hover:border-destructive/20"
                >
                    ✕
                </button>
            </div>
        );

    return (
        <button
            onClick={() => connect({ connector: injected() })}
            className="group relative px-5 py-2.5 rounded-xl font-semibold text-sm
                 bg-gradient-to-r from-purple-500/10 to-pink-500/10
                 border border-purple-500/30 text-foreground
                 hover:from-purple-500/20 hover:to-pink-500/20
                 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]
                 transition-all duration-300"
        >
            <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                </svg>
                Connect Wallet
            </span>
        </button>
    );
}
