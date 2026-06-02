import express from 'express';
import { z } from 'zod';
import { asyncHandler, fail, ok } from '../lib/http.js';
import { makeBarcodeValue, makeProductId } from '../lib/ids.js';
import { renderBarcodePng } from '../lib/barcode.js';
import { Product } from '../models/Product.js';
import { AuditLog } from '../models/AuditLog.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
            { productId: { $regex: q, $options: 'i' } },
            { barcodeValue: { $regex: q, $options: 'i' } }
          ]
        }
      : {};
    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return ok(res, products);
  })
);

router.post(
  '/',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      purchasePrice: z.number().nonnegative(),
      sellingPrice: z.number().nonnegative(),
      stockQty: z.number().int().nonnegative().default(0),
      lowStockThreshold: z.number().int().nonnegative().default(5)
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, 'Invalid input', parsed.error.flatten());

    const productId = makeProductId();
    const barcodeValue = makeBarcodeValue(productId);

    const created = await Product.create({
      productId,
      barcodeValue,
      ...parsed.data
    });

    await AuditLog.create({
      actorUserId: req.user.id,
      action: 'product.create',
      entityType: 'Product',
      entityId: created.productId,
      after: created.toObject()
    });

    return ok(res, created);
  })
);

router.get(
  '/:productId/barcode.png',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ productId: req.params.productId }).lean();
    if (!product) return fail(res, 404, 'Product not found');
    const png = await renderBarcodePng({ text: product.barcodeValue });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(png);
  })
);

router.patch(
  '/:productId',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const schema = z
      .object({
        name: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        purchasePrice: z.number().nonnegative().optional(),
        sellingPrice: z.number().nonnegative().optional(),
        lowStockThreshold: z.number().int().nonnegative().optional()
      })
      .strict();
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, 'Invalid input', parsed.error.flatten());

    const before = await Product.findOne({ productId: req.params.productId });
    if (!before) return fail(res, 404, 'Product not found');

    const updated = await Product.findOneAndUpdate(
      { productId: req.params.productId },
      { $set: parsed.data },
      { new: true }
    );

    await AuditLog.create({
      actorUserId: req.user.id,
      action: 'product.update',
      entityType: 'Product',
      entityId: req.params.productId,
      before: before.toObject(),
      after: updated.toObject()
    });

    return ok(res, updated);
  })
);

// Manual stock adjustment (admin only) with audit log
router.post(
  '/:productId/adjust-stock',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      newQty: z.number().int().nonnegative(),
      reason: z.string().min(1).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, 'Invalid input', parsed.error.flatten());

    const before = await Product.findOne({ productId: req.params.productId });
    if (!before) return fail(res, 404, 'Product not found');

    const updated = await Product.findOneAndUpdate(
      { productId: req.params.productId },
      { $set: { stockQty: parsed.data.newQty } },
      { new: true }
    );

    await AuditLog.create({
      actorUserId: req.user.id,
      action: 'stock.adjust',
      entityType: 'Product',
      entityId: req.params.productId,
      before: { stockQty: before.stockQty },
      after: { stockQty: updated.stockQty },
      reason: parsed.data.reason
    });

    return ok(res, updated);
  })
);

export default router;

