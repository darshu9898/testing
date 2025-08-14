// ✅ Correct import
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // ✅ Consistent model name
      const products = await prisma.product.findMany();
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const { name, description, price, stock, categoryId } = req.body;

      // ✅ Prevent rejecting price = 0, ensure valid number
      if (!name || price == null || isNaN(price)) {
        return res.status(400).json({ error: 'Name and valid price are required' });
      }

      const newProduct = await prisma.product.create({
        data: {
          name,
          description: description || '',
          price: parseFloat(price),
          stock: stock != null ? stock : 0,
          categoryId: categoryId || null
        }
      });

      return res.status(201).json(newProduct);
    }

    // ✅ Clean method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server error' });
  }
}
