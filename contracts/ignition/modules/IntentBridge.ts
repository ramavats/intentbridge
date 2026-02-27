import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IntentBridgeModule = buildModule("IntentBridgeModule", (m) => {
    const intentBox = m.contract("IntentBox");
    const registry = m.contract("SolverRegistry");
    const settlement = m.contract("SettlementEngine", [intentBox, registry]);
    return { intentBox, registry, settlement };
});

export default IntentBridgeModule;
