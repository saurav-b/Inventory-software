import express from 'express';
import { asyncHandler, ok } from '../lib/http.js';
import { Transaction } from '../models/Transaction.js';
import { Product } from '../models/Product.js';

const router = express.Router();

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const [salesToday, salesMonth] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'sale', deletedAt: { $exists: false }, createdAt: { $gte: dayStart } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'sale', deletedAt: { $exists: false }, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const lowStock = await Product.find({ $expr: { $lte: ['$stockQty', '$lowStockThreshold'] } })
      .sort({ stockQty: 1 })
      .limit(20)
      .lean();

    const stockSummary = await Product.aggregate([
      { $group: { _id: null, skuCount: { $sum: 1 }, totalUnits: { $sum: '$stockQty' } } }
    ]);

    // Rough profit estimation: sum((selling - purchase) * qty) for sales (snapshots use current prices; ok for estimation).
    const topSelling = await Transaction.aggregate([
      { $match: { type: 'sale', deletedAt: { $exists: false }, createdAt: { $gte: monthStart } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', qty: { $sum: '$items.qty' }, name: { $first: '$items.nameSnapshot' } } },
      { $sort: { qty: -1 } },
      { $limit: 10 }
    ]);

    return ok(res, {
      sales: {
        today: salesToday[0]?.total || 0,
        month: salesMonth[0]?.total || 0
      },
      stock: {
        skuCount: stockSummary[0]?.skuCount || 0,
        totalUnits: stockSummary[0]?.totalUnits || 0,
        lowStock
      },
      topSelling
    });
  })
);

export default router;

