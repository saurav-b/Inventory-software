import { nanoid } from 'nanoid';

export function makeProductId() {
  return `PRD-${nanoid(8).toUpperCase()}`;
}

export function makeBillNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `BILL-${y}${m}${d}-${nanoid(6).toUpperCase()}`;
}

export function makeBarcodeValue(productId) {
  // Keep barcode stable and scannable: encode the productId as the payload.
  // CODE128 supports alphanumeric + dash.
  return productId;
}

