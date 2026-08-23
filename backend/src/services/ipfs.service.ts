import { env } from "../env.js";

const PINATA_PIN_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const PINATA_FILE_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export interface PinResult {
  cid: string;
  size: number;
}

export function isIpfsConfigured(): boolean {
  return Boolean(env.PINATA_JWT);
}

/**
 * Pins a JSON document to IPFS via the Pinata REST API.
 */
export async function pinJson(
  body: Record<string, unknown>,
  name?: string
): Promise<PinResult> {
  const response = await fetch(PINATA_PIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: body,
      pinataMetadata: name ? { name } : undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata JSON pin failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { IpfsHash: string; PinSize: number };
  return { cid: data.IpfsHash, size: data.PinSize };
}

/**
 * Pins a binary file to IPFS via the Pinata REST API.
 */
export async function pinFile(
  file: File,
  name?: string
): Promise<PinResult> {
  const form = new FormData();
  form.append("file", file, name ?? file.name);

  const response = await fetch(PINATA_FILE_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.PINATA_JWT}` },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata file pin failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { IpfsHash: string; PinSize: number };
  return { cid: data.IpfsHash, size: data.PinSize };
}

export function gatewayUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}
