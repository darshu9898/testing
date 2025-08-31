// src/pages/api/products/index.js
// import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

// const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
   
      const products = await prisma.products.findMany();
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const { Name, Description = '', Price, Stock = 0, Image = null } = req.body;

      // Prevent rejecting price = 0, ensure valid number
      if (!Name || Price == null || isNaN(Price)) {
        return res.status(400).json({ error: 'Name and valid price are required' });
      }

      const newProduct = await prisma.products.create({
        data: {
          productName: Name,
          productDescription: Description || '',
          productPrice: parseFloat(Price),
          productStock: parseInt(Stock),
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