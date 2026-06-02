import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDb } from './lib/db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { makeBarcodeValue, makeProductId } from './lib/ids.js';

async function main() {
  const mongo = process.env.MONGODB_URI;
  if (!mongo) throw new Error('Missing MONGODB_URI');
  await connectDb(mongo);

  await Promise.all([User.deleteMany({}), Product.deleteMany({})]);

  const adminPass = await bcrypt.hash('Admin@12345', 10);
  const staffPass = await bcrypt.hash('Staff@12345', 10);

  await User.create([
    { email: 'admin@motif.local', name: 'Admin', passwordHash: adminPass, role: 'admin' },
    { email: 'staff@motif.local', name: 'Staff', passwordHash: staffPass, role: 'staff' }
  ]);

  const sample = [
    { name: 'Motif Cotton Scarf', category: 'Accessories', purchasePrice: 250, sellingPrice: 450, stockQty: 30 },
    { name: 'Printed Kurti', category: 'Apparel', purchasePrice: 600, sellingPrice: 999, stockQty: 20 },
    { name: 'Handbag Classic', category: 'Bags', purchasePrice: 900, sellingPrice: 1399, stockQty: 8 },
    { name: 'Earrings Set', category: 'Jewelry', purchasePrice: 120, sellingPrice: 249, stockQty: 50 }
  ];

  for (const s of sample) {
    const productId = makeProductId();
    const barcodeValue = makeBarcodeValue(productId);
    await Product.create({ productId, barcodeValue, lowStockThreshold: 5, ...s });
  }

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

