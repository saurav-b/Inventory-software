import express from 'express';
import { z } from 'zod';
import { asyncHandler, fail, ok } from '../lib/http.js';
import { makeBillNumber } from '../lib/ids.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { AuditLog } from '../models/AuditLog.js';
import { requireRole } from '../middleware/auth.js';
import { applyStockDelta } from '../services/stock.js';

const router = express.Router();

const itemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().positive()
});

const createSchema = z.object({
  type: z.enum(['purchase', 'sale', 'purchase_return', 'sales_return']),
  items: z.array(itemSchema).min(1),
  supplierName: z.string().optional(),
  customerName: z.string().optional(),
  discount: z.number().nonnegative().optional().default(0),
  tax: z.number().nonnegative().optional().default(0),
  payment: z.object({
    status: z.enum(['paid', 'pending', 'partial']).default('paid'),
    paidAmount: z.number().nonnegative().optional().default(0),
    method: z.string().optional()
  })
});

function computeTotals({ items, discount, tax, type }) {
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const total = Math.max(0, subtotal + tax - discount);
  return { subtotal, total };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const type = req.query.type ? String(req.query.type) : undefined;
    const filter = { deletedAt: { $exists: false } };
    if (type) filter.type = type;
    const txns = await Transaction.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return ok(res, txns);
  })
);

// Create purchase/sale/returns. For sales: require payment != pending to generate bill.
router.post(
  '/',
  requireRole('admin', 'staff'),
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, 'Invalid input', parsed.error.flatten());

    const { type, items, discount, tax, payment } = parsed.data;

    if (type === 'sale' && payment.status === 'pending') {
      return fail(res, 400, 'Sale invoice can be generated only after payment confirmation');
    }

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ productId: { $in: productIds } }).lean();
    const byId = new Map(products.map((p) => [p.productId, p]));
    for (const it of items) {
      if (!byId.has(it.productId)) return fail(res, 400, `Unknown productId: ${it.productId}`);
    }

    // Snapshot + line totals based on type
    const snapItems = items.map((it) => {
      const p = byId.get(it.productId);
      const unit =
        type === 'purchase' || type === 'purchase_return' ? p.purchasePrice : p.sellingPrice;
      const lineTotal = unit * it.qty;
      return {
        productId: p.productId,
        nameSnapshot: p.name,
        barcodeValueSnapshot: p.barcodeValue,
        qty: it.qty,
        purchasePriceSnapshot: p.purchasePrice,
        sellingPriceSnapshot: p.sellingPrice,
        unitPrice: unit,
        lineTotal
      };
    });

    const { subtotal, total } = computeTotals({ items: snapItems, discount, tax, type });
    const number = makeBillNumber();

    // Apply stock changes
    // purchase: +qty
    // sale: -qty
    // purchase_return: -qty
    // sales_return: +qty
    const sign =
      type === 'purchase' || type === 'sales_return'
        ? +1
        : type === 'sale' || type === 'purchase_return'
          ? -1
          : 0;

    try {
      for (const it of items) {
        await applyStockDelta({ productId: it.productId, deltaQty: sign * it.qty });
      }
    } catch (e) {
      if (e?.code === 'INSUFFICIENT_STOCK') return fail(res, 409, e.message);
      throw e;
    }

    const txn = await Transaction.create({
      type,
      number,
      items: snapItems.map((s) => ({
        productId: s.productId,
        nameSnapshot: s.nameSnapshot,
        barcodeValueSnapshot: s.barcodeValueSnapshot,
        qty: s.qty,
        purchasePriceSnapshot: s.purchasePriceSnapshot,
        sellingPriceSnapshot: s.sellingPriceSnapshot
      })),
      supplierName: parsed.data.supplierName,
      customerName: parsed.data.customerName,
      discount,
      tax,
      subtotal,
      total,
      payment: {
        status: payment.status,
        paidAmount: payment.paidAmount ?? (payment.status === 'paid' ? total : 0),
        totalAmount: total,
        method: payment.method
      },
      createdByUserId: req.user.id
    });

    await AuditLog.create({
      actorUserId: req.user.id,
      action: 'transaction.create',
      entityType: 'Transaction',
      entityId: txn.number,
      after: txn.toObject()
    });

    return ok(res, txn);
  })
);

// Soft-delete (admin only) + audit
router.delete(
  '/:number',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({ reason: z.string().min(1).optional() });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return fail(res, 400, 'Invalid input', parsed.error.flatten());

    const txn = await Transaction.findOne({ number: req.params.number, deletedAt: { $exists: false } });
    if (!txn) return fail(res, 404, 'Transaction not found');

    // Reverse stock effects on delete
    const sign =
      txn.type === 'purchase' || txn.type === 'sales_return'
        ? +1
        : txn.type === 'sale' || txn.type === 'purchase_return'
          ? -1
          : 0;
    for (const it of txn.items) {
      await applyStockDelta({ productId: it.productId, deltaQty: -sign * it.qty });
    }

    const before = txn.toObject();
    txn.deletedAt = new Date();
    txn.deletedByUserId = req.user.id;
    txn.deleteReason = parsed.data.reason;
    await txn.save();

    await AuditLog.create({
      actorUserId: req.user.id,
      action: 'transaction.delete',
      entityType: 'Transaction',
      entityId: txn.number,
      before,
      after: txn.toObject(),
      reason: parsed.data.reason
    });

    return ok(res, { deleted: true });
  })
);

export default router;

