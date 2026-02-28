"use client";
import { useState, useEffect } from "react";
import { useConnect, useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";

const REQUIRED_CHAIN_ID = 420420417;

export function ConnectWallet() {
    const [mounted, setMounted] = useState(false);
    const { connect } = useConnect();
    const { address, isConnected, chainId } = useAccount();
    const { disconnect } = useDisconnect();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    useEffect(() => setMounted(true), []);

    const isWrongNetwork = isConnected && chainId !== REQUIRED_CHAIN_ID;

    if (!mounted) {
        return (
            <div className="px-4 py-2 rounded-xl bg-muted/30 animate-pulse w-28 sm:w-36 h-9 sm:h-10" />
        );
    }

    if (isWrongNetwork) {
        return (
            <button
                onClick={() => switchChain({ chainId: REQUIRED_CHAIN_ID })}
                disabled={isSwitching}
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm
                           bg-warning/10 border border-warning/40 text-warning
                           hover:bg-warning/20 hover:border-warning/60
                           transition-all duration-300 disabled:opacity-50"
            >
                <span className="flex items-center gap-1.5 sm:gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    {isSwitching ? "Switching…" : "Switch Network"}
                </span>
            </button>
        );
    }

    if (isConnected) {
        return (
            <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl glass-card">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-xs sm:text-sm font-mono text-foreground">
                        {address?.slice(0, 6)}…{address?.slice(-4)}
                    </span>
                </div>
                <button
                    onClick={() => disconnect()}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium
                               text-muted-foreground hover:text-destructive hover:bg-destructive/10
                               transition-all duration-200 border border-transparent hover:border-destructive/20"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => connect({ connector: injected() })}
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm
                       bg-gradient-to-r from-[#FFECD1]/10 to-[#ff6b35]/10
                       border border-[#FFECD1]/30 text-foreground
                       hover:from-[#FFECD1]/20 hover:to-[#ff6b35]/20
                       hover:border-[#FFECD1]/50 hover:shadow-[0_0_20px_rgba(255,236,209,0.1)]
                       transition-all duration-300"
        >
            <span className="flex items-center gap-1.5 sm:gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                </svg>
                Connect Wallet
            </span>
        </button>
    );
}
