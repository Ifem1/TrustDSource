import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";

export const genlayerStudionet = defineChain({
  id: 61999,
  name: "GenLayer StudioNet",
  nativeCurrency: {
    name: "GEN Token",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://studio.genlayer.com/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "GenLayer Explorer",
      url: "https://genlayer-explorer.vercel.app",
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [genlayerStudionet],
  connectors: [injected()],
  transports: {
    [genlayerStudionet.id]: http("https://studio.genlayer.com/api"),
  },
});
