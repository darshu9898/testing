// src/pages/api/cart.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User Id required' });

    // GET: Fetch user's cart
    if (req.method === 'GET') {
      const cartItems = await prisma.cart.findMany({
        where: { userId: parseInt(userId) },
        include: { product: true }, // includes product details
      });
      return res.status(200).json(cartItems);
    }

    // POST: Add or update cart
    if (req.method === 'POST') {
      const { cartItems } = req.body; // expects [{ productId, quantity }]

      if (!cartItems || !Array.isArray(cartItems)) {
        return res.status(400).json({ error: 'cartItems array required' });
      }

      const results = [];

      for (const item of cartItems) {
        const { productId, quantity } = item; // matches schema

        const existing = await prisma.cart.findFirst({
          where: { userId: parseInt(userId), productId: parseInt(productId) }
        });

        if (existing) {
          const updated = await prisma.cart.update({
            where: { cartId: existing.cartId },
            data: { quantity: existing.quantity + parseInt(quantity) } // matches schema
          });
          results.push(updated);
        } else {
          const newItem = await prisma.cart.create({
            data: {
              userId: parseInt(userId),
              productId: parseInt(productId),
              quantity: parseInt(quantity), // matches schema
            }
          });
          results.push(newItem);
        }
      }
      return res.status(200).json(results);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
