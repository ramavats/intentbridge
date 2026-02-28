"use client";
import { ConnectWallet } from "../components/ConnectWallet";
import { SubmitIntent } from "../components/SubmitIntent";
import { IntentList } from "../components/IntentList";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                IntentBridge
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
                Polkadot Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <span className="w-2 h-2 rounded-full bg-success status-pulse" />
              <span className="text-xs font-medium text-success">Testnet</span>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-6">
        <div className="text-center mb-10 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Cross-Chain Intents
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Submit your desired trade. Solvers compete to fill it with optimal execution
            across Polkadot parachains.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Submit Intent */}
          <div className="lg:col-span-2">
            <SubmitIntent />
          </div>

          {/* Right: Intent List */}
          <div className="lg:col-span-3">
            <IntentList />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Built for Polkadot Solidity Hackathon 2026
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://420420417.testnet.routescan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Block Explorer ↗
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
