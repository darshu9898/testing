// pages/api/products/[id]/stock.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { Stock } = req.body;

    if (Stock == null || isNaN(Stock)) {
      return res.status(400).json({ error: 'Valid stock quantity is required' });
    }

    const updatedProduct = await prisma.products.update({
      where: { productId: parseInt(id) },
      data: { productStock: parseInt(Stock) }
    });

    return res.status(200).json(updatedProduct);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server error' });
  }
}
