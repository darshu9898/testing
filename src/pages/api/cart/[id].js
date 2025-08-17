// src/pages/api/cart/[id].js
import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    // getContext is async
    const { userId, sessionId } = await getContext(req, res);

    if (!userId && !sessionId) {
      return res.status(401).json({ error: 'Authentication required (userId or sessionId)' });
    }

    const cartId = parseInt(req.query.id, 10);
    if (!cartId) return res.status(400).json({ error: 'Cart id required' });

    // find cart item
    const existing = await prisma.cart.findUnique({ where: { cartId } });
    if (!existing) return res.status(404).json({ error: 'Cart item not found' });

    const isOwner = userId ? existing.userId === userId : existing.sessionId === sessionId;
    if (!isOwner) return res.status(403).json({ error: 'Not allowed' });

    // ---------------- PATCH: update quantity ----------------
    if (req.method === 'PATCH') {
      const { quantity, delta } = req.body;

      const product = await prisma.products.findUnique({
        where: { productId: existing.productId },
      });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      let newQty;
      if (typeof quantity !== 'undefined') newQty = parseInt(quantity, 10);
      else if (typeof delta !== 'undefined') newQty = existing.quantity + parseInt(delta, 10);
      else return res.status(400).json({ error: 'Provide quantity or delta in body' });

      if (newQty <= 0) {
        await prisma.cart.delete({ where: { cartId } });
        return res.status(200).json({ action: 'deleted', message: 'Item removed from cart' });
      }

      if (newQty > product.productStock) {
        return res.status(400).json({ error: `Only ${product.productStock} units available` });
      }

      const updated = await prisma.cart.update({
        where: { cartId },
        data: { quantity: newQty },
      });

      const itemWithProduct = await prisma.cart.findUnique({
        where: { cartId: updated.cartId },
        include: { product: true },
      });

      return res.status(200).json({ action: 'updated', item: itemWithProduct });
    }

    // ---------------- DELETE: remove item ----------------
    if (req.method === 'DELETE') {
      await prisma.cart.delete({ where: { cartId } });
      return res.status(200).json({ action: 'deleted', cartId });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    if (err?.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
