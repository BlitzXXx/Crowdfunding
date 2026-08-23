import { sepolia } from "wagmi/chains";
import { defineChain, parseAbi } from "viem";

export const isLocalChain =
  import.meta.env.VITE_CHAIN === "localhost";

export const localhostChain = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});

export const supportedChains = isLocalChain ? [localhostChain] : [sepolia];
export const activeChain = supportedChains[0];

export const FACTORY_ADDRESS = (import.meta.env.VITE_FACTORY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL ?? "";
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const factoryAbi = parseAbi([
  "function createCampaign(uint256 goal, uint256 duration, string ipfsHash) returns (address)",
  "function getCampaignsPaginated(uint256 start, uint256 limit) view returns (address[])",
  "function getCampaignCount() view returns (uint256)",
  "function getCampaignsByCreator(address creator) view returns (address[])",
  "function predictNextCampaignAddress() view returns (address)",
  "function verifyCampaign(address campaign) view returns (bool)",
]);

export const campaignAbi = parseAbi([
  "function contribute() payable",
  "function refund()",
  "function cancel()",
  "function withdraw()",
  "function getCampaignDetails() view returns (address, uint256, uint256, uint256, bool, bool, string, uint256)",
  "function getContribution(address contributor) view returns (uint256)",
  "function isActive() view returns (bool)",
  "function getState() view returns (uint8)",
  "function getRemainingTime() view returns (uint256)",
  "function getProgress() view returns (uint256)",
  "function creator() view returns (address)",
  "function goal() view returns (uint256)",
  "function deadline() view returns (uint256)",
  "function totalFunds() view returns (uint256)",
  "function goalReached() view returns (bool)",
  "function fundsWithdrawn() view returns (bool)",
]);

export interface CampaignDetails {
  address: `0x${string}`;
  creator: `0x${string}`;
  goal: bigint;
  deadline: bigint;
  totalFunds: bigint;
  goalReached: boolean;
  fundsWithdrawn: boolean;
  ipfsHash: string;
  contributorsCount: bigint;
  state: number;
}

export const CAMPAIGN_STATE = {
  ACTIVE: 0,
  SUCCESSFUL: 1,
  FAILED: 2,
  CANCELLED: 3,
} as const;

declare global {
  interface ImportMetaEnv {
    readonly VITE_CHAIN?: string;
    readonly VITE_FACTORY_ADDRESS?: string;
    readonly VITE_SUBGRAPH_URL?: string;
    readonly VITE_API_URL?: string;
    readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  }
}
