"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../lib/wagmi";
import "./globals.css";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>IntentBridge — Cross-Chain Intent Settlement</title>
        <meta
          name="description"
          content="Submit cross-chain intents on Polkadot Hub. Solvers compete to fill your orders with optimal execution."
        />
      </head>
      <body className="min-h-screen bg-background text-foreground bg-grid-pattern">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
