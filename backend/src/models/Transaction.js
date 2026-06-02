import mongoose from 'mongoose';

const TransactionItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    nameSnapshot: { type: String, required: true },
    barcodeValueSnapshot: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    purchasePriceSnapshot: { type: Number, required: true, min: 0 },
    sellingPriceSnapshot: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: ['paid', 'pending', 'partial'], default: 'paid' },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    method: { type: String }
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['purchase', 'sale', 'purchase_return', 'sales_return'],
      index: true
    },
    number: { type: String, required: true, index: true }, // invoice/bill/txn number
    items: { type: [TransactionItemSchema], required: true },
    supplierName: { type: String },
    customerName: { type: String },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: { type: PaymentSchema, required: true },
    notes: { type: String },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date },
    deletedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deleteReason: { type: String }
  },
  { timestamps: true }
);

TransactionSchema.index({ type: 1, number: 1 }, { unique: true });

export const Transaction = mongoose.model('Transaction', TransactionSchema);

