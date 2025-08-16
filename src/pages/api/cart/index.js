// src/pages/api/cart/index.js
import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    const { userId, sessionId } = await getContext(req, res);

    if (!userId && !sessionId) {
      return res.status(401).json({ error: 'Authentication required (userId or sessionId)' });
    }

    const ownerWhere = userId ? { userId } : { sessionId };

    // ---------------- GET CART ----------------
    if (req.method === 'GET') {
      const rows = await prisma.cart.findMany({
        where: ownerWhere,
        include: { product: true },
        orderBy: { cartId: 'asc' },
      });

      const items = rows.map(r => ({
        cartId: r.cartId,
        productId: r.productId,
        quantity: r.quantity,
        product: r.product,
        itemTotal: r.product.productPrice * r.quantity,
      }));
      const grandTotal = items.reduce((s, it) => s + it.itemTotal, 0);

      return res.status(200).json({ items, grandTotal });
    }

    // ---------------- ADD / BULK SYNC CART ----------------
    if (req.method === 'POST') {
      const { productId, quantity = 1, cartItems } = req.body;

      // BULK SYNC MODE
      if (Array.isArray(cartItems)) {
        const results = [];

        //  $transaction cannot take an async callback with for-of inside.
        // Use map + prisma.$transaction([...]) pattern
        const txResults = await prisma.$transaction(
          cartItems.map(async it => {
            const pId = parseInt(it.productId, 10);
            const addQty = Math.max(1, parseInt(it.quantity || 1, 10));

            const product = await prisma.products.findUnique({ where: { productId: pId } });
            if (!product) return { productId: pId, error: 'Product not found' };

            const existing = await prisma.cart.findFirst({
              where: { productId: pId, ...(userId ? { userId } : { sessionId }) },
            });

            if (existing) {
              const desired = existing.quantity + addQty;
              if (desired > product.productStock)
                return { productId: pId, error: `Only ${product.productStock} available` };

              const updated = await prisma.cart.update({
                where: { cartId: existing.cartId },
                data: { quantity: desired },
              });
              return { action: 'updated', item: updated };
            } else {
              if (addQty > product.productStock)
                return { productId: pId, error: `Only ${product.productStock} available` };

              const created = await prisma.cart.create({
                data: {
                  productId: pId,
                  quantity: addQty,
                  ...(userId ? { userId } : { sessionId }),
                },
              });
              return { action: 'created', item: created };
            }
          })
        );

        // enrich with product info
        const enriched = await Promise.all(
          txResults.map(async r => {
            if (r.item?.cartId) {
              const withProduct = await prisma.cart.findUnique({
                where: { cartId: r.item.cartId },
                include: { product: true },
              });
              return { ...r, item: withProduct };
            }
            return r;
          })
        );

        return res.status(200).json({ results: enriched });
      }

      // SINGLE ITEM MODE
      if (!productId) return res.status(400).json({ error: 'productId required' });

      const pId = parseInt(productId, 10);
      const qty = Math.max(1, parseInt(quantity, 10));

      const result = await prisma.$transaction(async tx => {
        const product = await tx.products.findUnique({ where: { productId: pId } });
        if (!product) throw { status: 404, message: 'Product not found' };

        const existing = await tx.cart.findFirst({
          where: { productId: pId, ...(userId ? { userId } : { sessionId }) },
        });

        if (existing) return { action: 'exists', item: existing };

        if (qty > product.productStock)
          throw { status: 400, message: `Only ${product.productStock} units available` };

        const created = await tx.cart.create({
          data: {
            productId: pId,
            quantity: qty,
            ...(userId ? { userId } : { sessionId }),
          },
        });

        return { action: 'created', item: created };
      });

      if (result.item?.cartId) {
        const itemWithProduct = await prisma.cart.findUnique({
          where: { cartId: result.item.cartId },
          include: { product: true },
        });
        return res
          .status(result.action === 'created' ? 201 : 200)
          .json({ action: result.action, item: itemWithProduct });
      }

      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    if (err?.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
