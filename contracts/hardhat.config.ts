import { type HardhatUserConfig, configVariable } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViem, hardhatKeystore],
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: "./src",
  },
  networks: {
    polkadotTestnet: {
      type: "http",
      url: "https://services.polkadothub-rpc.com/testnet",
      chainId: 420420417,
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
};

export default config;

