"use client";
import { ConnectWallet } from "../components/ConnectWallet";
import { SubmitIntent } from "../components/SubmitIntent";
import { IntentList } from "../components/IntentList";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-[#1a0005]/90 backdrop-blur-xl">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#FFECD1] to-[#ff6b35] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3E000C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                IntentBridge
              </h1>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
                Polkadot Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <span className="w-2 h-2 rounded-full bg-success status-pulse" />
              <span className="text-xs font-medium text-success">Testnet</span>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sm:pb-6">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 sm:mb-3">
            <span className="bg-gradient-to-r from-[#FFECD1] via-[#ff6b35] to-[#FFECD1] bg-clip-text text-transparent">
              Cross-Chain Intents
            </span>
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base max-w-lg mx-auto leading-relaxed px-4">
            Submit your desired trade. Solvers compete to fill it with optimal
            execution across Polkadot parachains.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-8 sm:pb-16">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
          {/* Left: Submit Intent */}
          <div className="w-full lg:w-2/5 lg:min-w-[340px]">
            <SubmitIntent />
          </div>

          {/* Right: Intent List */}
          <div className="w-full lg:flex-1">
            <IntentList />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 sm:py-6 mt-auto">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Built for Polkadot Solidity Hackathon 2026
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://polkadot.testnet.routescan.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Block Explorer ↗
            </a>
            <a
              href="https://github.com/ramavats/intentbridge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
