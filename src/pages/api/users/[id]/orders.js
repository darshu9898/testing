// src/pages/api/orders.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Extract user/session
    const { userId, sessionId } = await getContext(req, res);

    if (!userId) {
      return res.status(400).json({ error: 'User Id required' });
    }

    // GET: Fetch user's orders
    if (req.method === 'GET') {
      const orders = await prisma.orders.findMany({
        where: { userId: parseInt(userId) },
        include: {
          orderDetails: {
            include: {
              product: true, // bring product info
            },
          },
          payments: true,
        },
      });

      return res.status(200).json(orders);
    }

    // POST: Create a new order
    if (req.method === 'POST') {
      const { orderItems } = req.body; // expects [{ productId, quantity }]
      if (!orderItems || !Array.isArray(orderItems)) {
        return res.status(400).json({ error: 'orderItems array required' });
      }

      // calculate total amount
      const products = await prisma.products.findMany({
        where: {
          productId: { in: orderItems.map(i => parseInt(i.productId)) },
        },
      });

      let totalAmount = 0;
      const orderDetailsData = orderItems.map(item => {
        const product = products.find(p => p.productId === parseInt(item.productId));
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        const price = product.productPrice;
        totalAmount += price * parseInt(item.quantity);
        return {
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          productPrice: price,
        };
      });

      // create order with order details
      const newOrder = await prisma.orders.create({
        data: {
          userId: parseInt(userId),
          orderAmount: totalAmount,
          orderDate: new Date(),
          orderDetails: {
            create: orderDetailsData,
          },
        },
        include: {
          orderDetails: { include: { product: true } },
        },
      });

      return res.status(201).json(newOrder);
    }

    // Unsupported Method
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}