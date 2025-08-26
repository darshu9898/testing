// pages/api/admin/products/[id].js
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/adminAuth';

export default async function handler(req, res) {
  if (!requireAdminAuth(req, res)) return;

  const id = parseInt(req.query.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    if (req.method === 'GET') {
      const product = await prisma.products.findUnique({
        where: { productId: id },
      });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.status(200).json(product);
    }

    if (req.method === 'PATCH') {
      const { productName, productDescription, productPrice, productStock, productImage } = req.body;

      const updated = await prisma.products.update({
        where: { productId: id },
        data: {
          ...(productName && { productName }),
          ...(productDescription && { productDescription }),
          ...(productPrice != null && { productPrice: parseInt(productPrice, 10) }),
          ...(productStock != null && { productStock: parseInt(productStock, 10) }),
          ...(productImage !== undefined && { productImage }),
        },
      });

      return res.status(200).json(updated);
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
