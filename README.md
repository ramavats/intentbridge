
# ⚡ IntentBridge

> The first cross-chain intent settlement protocol on Polkadot Hub EVM.

IntentBridge lets users express a single signed intent ("I want to move X tokens from chain A to chain B") and have competing solver nodes execute the optimal cross-chain route automatically — using Polkadot's native XCM infrastructure under the hood. No manual multi-hop. No managing gas on multiple chains. No failed message recovery.

[![Polkadot Hub](https://img.shields.io/badge/Polkadot%20Hub-EVM-E6007A)](https://docs.polkadot.com)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-420420417-E6007A)](https://420420417.testnet.routescan.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🧩 The Problem

Every Polkadot user today must manually:
- Compose multi-step XCM calls across parachains
- Manage gas tokens on each individual chain
- Handle failed message recovery themselves
- Track asset routing across fragmented liquidity

XCM messages are **intent-driven by design** — yet there is no user-facing intent execution layer on Polkadot Hub. IntentBridge fills that gap.

---

## 🏗️ Architecture

```
User → IntentBox.sol → [Solver Network] → SettlementEngine.sol → XCM Precompile → Destination Chain
                              ↑
                     SolverRegistry.sol
                     (bonds + disputes)
                              ↑
                   PVM Pathfinder (ink!)
                   (optimal route engine)
```

### Components

| Component | Language | Description |
|---|---|---|
| `IntentBox.sol` | Solidity | User-facing escrow — accepts signed intents and holds funds |
| `SolverRegistry.sol` | Solidity | Permissionless solver registry with bonded collateral and 30-min dispute window |
| `SettlementEngine.sol` | Solidity | Verifies solver fulfillment, calls XCM precompile to dispatch cross-chain transfer |
| `IXcm.sol` | Solidity | Interface to Polkadot Hub's native XCM precompile at `0xA0000` |
| `Pathfinder` | Rust/ink! | PVM module computing optimal routing paths across parachains via Dijkstra |
| Solver Bot | Node.js | Off-chain solver that monitors intents and fills them for fees |
| Frontend | Next.js + Wagmi | User interface for submitting intents and tracking status |

---

## 📍 Deployed Contracts (Polkadot Hub TestNet — Chain ID: 420420417)

| Contract | Address |
|---|---|
| IntentBox | `0x406906e30A236f33E5705f1060ae45795E6C77d0` |
| SolverRegistry | `0x4Aaf1472E3B810d05721569A454975f67825FC20` |
| SettlementEngine | `0x7b08B4E74Efaffe917c78473dF38Bc1889512B42` |
| Pathfinder (PVM/ink!) | `0x7013DC4df91c1A8f0D33d6D6F44310e1565FBb5c` |

🔍 View on explorer: [https://polkadot.testnet.routescan.io](https://polkadot.testnet.routescan.io/)

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Rust + `cargo-contract`
- MetaMask with Polkadot Hub TestNet configured
- Polkadot.js browser extension

### 1. Clone and Install

```bash
git clone https://github.com/ramavats/intentbridge.git
cd intentbridge
```

### 2. Smart Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

Deploy to Polkadot Hub TestNet:
```bash
npx hardhat ignition deploy ignition/modules/IntentBridge.ts --network polkadotTestnet
```

### 3. PVM Pathfinder

```bash
cd pvm/pathfinder
cargo contract build --release
# Deploy via [https://ui.use.ink](https://ui.use.ink/)
```

### 4. Solver Bot

```bash
cd solver
npm install
cp .env.example .env
# Fill in your private key and contract addresses in .env
npm start
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## ⚙️ MetaMask Network Config

| Field | Value |
|---|---|
| Network Name | Polkadot Hub TestNet |
| RPC URL | `https://services.polkadothub-rpc.com/testnet` |
| Chain ID | `420420417` |
| Symbol | `PAS` |
| Explorer | `https://polkadot.testnet.routescan.io` |

---

## 🔄 How It Works — User Flow

1. **User connects MetaMask** and navigates to the Submit Intent page
2. **User fills the form** — amount, destination chain, min output, max solver fee, TTL
3. **IntentBox.sol** escrows the user's funds and emits `IntentSubmitted`
4. **Solver bot** detects the event within 4 seconds via block polling
5. **Solver queries** the PVM Pathfinder for the optimal XCM route
6. **SettlementEngine.sol** calls the XCM precompile (`0xA0000`) to dispatch the cross-chain transfer
7. **Intent is marked filled** — solver's fee enters a 30-minute dispute window
8. **After 30 minutes** — solver calls `claimPayout()` to receive their fee
9. **If solver cheats** — anyone can call `slashSolver()` during the dispute window

---

## 📁 Project Structure

```
intentbridge/
├── contracts/                    # Solidity EVM contracts
│   ├── contracts/
│   │   ├── IXcm.sol              # XCM precompile interface
│   │   ├── IntentBox.sol         # User-facing escrow
│   │   ├── SolverRegistry.sol    # Solver bonds + dispute window
│   │   └── SettlementEngine.sol  # XCM dispatch + settlement
│   ├── test/
│   │   └── IntentBridge.test.ts  # Contract tests
│   ├── ignition/modules/
│   │   └── IntentBridge.ts       # Deployment module
│   └── hardhat.config.ts
├── pvm/                          # Rust/ink! PVM module
│   └── pathfinder/
│       └── src/lib.rs            # Route optimization engine
├── solver/                       # Off-chain solver bot
│   ├── index.js                  # Main solver logic
│   ├── .env.example              # Environment template
│   └── package.json
└── frontend/                     # Next.js dApp
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx        # WagmiProvider wrapper
    │   │   └── page.tsx          # Main page
    │   ├── components/
    │   │   ├── ConnectWallet.tsx
    │   │   ├── SubmitIntent.tsx
    │   │   └── IntentList.tsx
    │   └── lib/
    │       └── wagmi.ts          # Polkadot Hub chain config
    └── package.json
```

---

## 🧪 Running Tests

```bash
cd contracts
npx hardhat test
```

```bash
cd pvm/pathfinder
cargo test
```

---

## 🛣️ What's Next — Implementation Roadmap

### 🔴 Critical

- [ ] **Real XCM message encoding** — replace the placeholder `buildXcmMessage()` in solver with actual SCALE-encoded `WithdrawAsset → BuyExecution → DepositAsset` XCM program using `@polkadot/api`
- [ ] **Solver → Pathfinder integration** — have the solver call the deployed ink! Pathfinder contract at `0x7013DC4df91c1A8f0D33d6D6F44310e1565FBb5c` to compute routes instead of hardcoding
- [ ] **IntentList frontend component** — display open intents and their status in the UI
- [ ] **End-to-end test** — full flow: submit intent → solver fills → verify on-chain → claim payout
- [ ] **Demo video** — 3-minute walkthrough of the full user flow

### 🟡 Post-Hackathon Milestone 2 

- [ ] **ERC-7683 compatibility shim** — implement `ISettler` and `OnchainCrossChainOrder` interfaces so Ethereum-native solvers (Across Protocol, UniswapX) can fill Polkadot intents
- [ ] **Multi-hop routing** — intents that route through Hydration → Asset Hub → Ethereum via Snowbridge, composed into one user-signed intent
- [ ] **Full Dijkstra pathfinder** — upgrade PVM Pathfinder from greedy BFS to weighted shortest path with real HRMP channel cost data
- [ ] **Solver reputation system** — on-chain scoring of solver fill rate, speed, and accuracy
- [ ] **Governance analytics dashboard** — track intent volume, solver competition, fee market dynamics

### 🟢 Milestone 3 — Protocol Sustainability

- [ ] **Solver fee market** — dynamic fee pricing based on route complexity and competition
- [ ] **Protocol treasury** — small % of fees accumulate in a DAO-controlled treasury
- [ ] **Mainnet deployment** — deploy to Polkadot Hub mainnet post-audit
- [ ] **W3F Grant application** — "Cross-Chain UX Infrastructure for Polkadot" — directly aligned with Web3 Foundation's stated infrastructure priorities
- [ ] **ERC-7683 standard proposal** — submit Polkadot-native extension of the cross-chain intent standard to the ecosystem

---

## 🔗 Key Resources

- [Polkadot Hub Docs](https://docs.polkadot.com)
- [XCM Precompile Reference](https://docs.polkadot.com/smart-contracts/precompiles/xcm/)
- [ERC-7683 Specification](https://eips.ethereum.org/EIPS/eip-7683)
- [ink! v6 Documentation](https://use.ink)
- [Contracts UI](https://ui.use.ink)

---

## 🏆 Hackathon

Built for the **Polkadot Solidity Hackathon 2026**.

- **Track**: EVM Track + PVM Experiments
- **Uses**: XCM Precompile, EVM smart contracts, ink! PVM module
- **Problem solved**: Cross-chain UX fragmentation on Polkadot

---

## 📄 License

MIT © 2026 IntentBridge
