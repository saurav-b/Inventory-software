import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 0 },
    barcodeValue: { type: String, required: true, unique: true, index: true },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 }
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', ProductSchema);

