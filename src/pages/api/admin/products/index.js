// pages/api/admin/products/index.js
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/adminAuth';

export default async function handler(req, res) {
  // ✅ Protect route
  if (!requireAdminAuth(req, res)) return;

  try {
    if (req.method === 'POST') {
      const { productName, productDescription, productPrice, productStock, productImage } = req.body;

      if (!productName || !productDescription || productPrice == null || productStock == null) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const created = await prisma.products.create({
        data: {
          productName,
          productDescription,
          productPrice: parseInt(productPrice, 10),
          productStock: parseInt(productStock, 10),
          productImage: productImage || null,
        },
      });

      return res.status(201).json(created);
    }

    if (req.method === 'GET') {
      const products = await prisma.products.findMany({
        orderBy: { created_at: 'desc' },
      });
      return res.status(200).json(products);
    }

    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
