// Utility functions for the SuiCert platform

// Constants
export const SUI_TO_MIST = 1_000_000_000;
export const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space';
export const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

// Approximate SUI to VND conversion rate (this should be fetched from an API in production)
// As of example: 1 SUI ≈ 80,000 VND (this is just an example rate)
export const SUI_TO_VND_RATE = 80000;

/**
 * Convert SUI to MIST
 */
export function suiToMist(sui: number): number {
  return Math.floor(sui * SUI_TO_MIST);
}

/**
 * Convert MIST to SUI
 */
export function mistToSui(mist: number): number {
  return mist / SUI_TO_MIST;
}

/**
 * Convert SUI to VND
 */
export function suiToVnd(sui: number): number {
  return Math.floor(sui * SUI_TO_VND_RATE);
}

/**
 * Format VND with thousand separators
 */
export function formatVnd(vnd: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(vnd);
}

/**
 * Format SUI amount
 */
export function formatSui(sui: number): string {
  return `${sui.toFixed(2)} SUI`;
}

/**
 * Upload a file to Walrus
 */
export async function uploadToWalrus(file: File, epochs: number = 5): Promise<string> {
  const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`, {
    method: 'PUT',
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Walrus upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  const blobId = result.newlyCreated?.blobObject.blobId || result.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error('No blobId received from Walrus');
  }

  return blobId;
}

/**
 * Upload JSON data to Walrus
 */
export async function uploadJsonToWalrus(data: any, epochs: number = 5): Promise<string> {
  const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([jsonBlob], 'data.json', { type: 'application/json' });
  return uploadToWalrus(file, epochs);
}

/**
 * Fetch data from Walrus
 */
export async function fetchFromWalrus(blobId: string): Promise<Blob> {
  const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from Walrus: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Fetch JSON data from Walrus
 */
export async function fetchJsonFromWalrus<T>(blobId: string): Promise<T> {
  const blob = await fetchFromWalrus(blobId);
  const text = await blob.text();
  return JSON.parse(text);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
