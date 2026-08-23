import { API_URL } from "@/config/contracts";

export interface PinResult {
  cid: string;
  size: number;
  url: string;
}

export async function pinCampaignMetadata(metadata: {
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  websiteUrl?: string;
  twitterHandle?: string;
}): Promise<PinResult> {
  const res = await fetch(`${API_URL}/api/v1/ipfs/json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: metadata, name: `${metadata.title}.json` }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `IPFS upload failed (${res.status})`);
  }

  return res.json();
}
