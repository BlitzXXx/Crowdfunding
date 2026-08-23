import { createConfig, http, injected } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { supportedChains } from "./contracts";

const transports = Object.fromEntries(
  supportedChains.map((chain) => [chain.id, http()])
);

export const wagmiConfig = createConfig({
  chains: supportedChains as never,
  connectors: [injected(), metaMask()],
  transports: transports as never,
});
