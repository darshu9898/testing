// src/pages/api/cart/merge.js
import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, sessionId } = await getContext(req, res);

  if (!userId || !sessionId) return res.status(400).json({ error: 'Missing userId or sessionId' });

  // Fetch guest cart items
  const guestItems = await prisma.cart.findMany({ where: { sessionId } });

  for (const item of guestItems) {
    // Try to upsert into user cart
    await prisma.cart.upsert({
      where: { userId_productId: { userId, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: { userId, productId: item.productId, quantity: item.quantity },
    });
  }

  // Remove guest cart
  await prisma.cart.deleteMany({ where: { sessionId } });

  res.status(200).json({ action: 'merged', itemsCount: guestItems.length });
}
