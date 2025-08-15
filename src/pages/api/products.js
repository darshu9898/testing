import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
   
      const products = await prisma.product.findMany();
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const { productName, productDescription = '', productPrice, produtQty = 0, productImage = null } = req.body;

      // Prevent rejecting price = 0, ensure valid number
      if (!productName || productPrice == null || isNaN(productPrice)) {
        return res.status(400).json({ error: 'Name and valid price are required' });
      }

      const newProduct = await prisma.product.create({
        data: {
          productName: Name,
          productDescription: Description || '',
          productPrice: parseFloat(Price),
          productQty: parseInt(Stock),
          productImage: Image
        }
      });

      return res.status(201).json(newProduct);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server error' });
  }
}
