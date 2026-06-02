import { Product } from '../models/Product.js';

export async function applyStockDelta({ productId, deltaQty }) {
  const product = await Product.findOne({ productId });
  if (!product) {
    const err = new Error(`Product not found: ${productId}`);
    err.code = 'PRODUCT_NOT_FOUND';
    throw err;
  }
  const nextQty = product.stockQty + deltaQty;
  if (nextQty < 0) {
    const err = new Error(`Insufficient stock for ${productId}`);
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }
  product.stockQty = nextQty;
  await product.save();
  return product;
}

