import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';



export default async function handler(req, res) {
  try {
    const { userId, sessionId } = getContext(req);
    if (!userId && !sessionId) {
      return res.status(401).json({ error: 'Authentication required (userId or sessionId)' });
    }

    // Helper for query condition depending on auth type
    const ownerWhere = userId ? { userId } : { sessionId };

    // ---------------------------------------------------------
    // GET /api/cart  -> fetch full cart for user or guest session
    // ---------------------------------------------------------
    if (req.method === 'GET') {
      const rows = await prisma.cart.findMany({
        where: ownerWhere,
        include: { product: true },
        orderBy: { cartId: 'asc' }
      });

      const items = rows.map(r => ({
        cartId: r.cartId,
        productId: r.productId,
        quantity: r.quantity,
        product: r.product,
        itemTotal: r.product.productPrice * r.quantity
      }));
      const grandTotal = items.reduce((s, it) => s + it.itemTotal, 0);

      return res.status(200).json({ items, grandTotal });
    }

    // ---------------------------------------------------------
    // POST /api/cart
    // Modes:
    //  - product-page: { productId, quantity = 1 } -> CREATE only (returns exists if already present)
    //  - bulk-sync: { cartItems: [{ productId, quantity }, ...] } -> create or increment (transactional)
    // ---------------------------------------------------------
    if (req.method === 'POST') {
      const { productId, quantity = 1, cartItems } = req.body;

      // BULK SYNC MODE
      if (Array.isArray(cartItems)) {
        const results = [];
        await prisma.$transaction(async (tx) => {
          for (const it of cartItems) {
            const pId = parseInt(it.productId, 10);
            const addQty = Math.max(1, parseInt(it.quantity || 1, 10));

            const product = await tx.products.findUnique({ where: { productId: pId } });
            if (!product) {
              results.push({ productId: pId, error: 'Product not found' });
              continue;
            }

            const existing = await tx.cart.findFirst({
              where: { productId: pId, ...(userId ? { userId } : { sessionId }) }
            });

            if (existing) {
              const desired = existing.quantity + addQty;
              if (desired > product.productStock) {
                results.push({ productId: pId, error: `Only ${product.productStock} available` });
                continue;
              }
              const updated = await tx.cart.update({
                where: { cartId: existing.cartId },
                data: { quantity: desired }
              });
              results.push({ action: 'updated', item: updated });
            } else {
              if (addQty > product.productStock) {
                results.push({ productId: pId, error: `Only ${product.productStock} available` });
                continue;
              }
              const created = await tx.cart.create({
                data: {
                  productId: pId,
                  quantity: addQty,
                  ...(userId ? { userId } : { sessionId })
                }
              });
              results.push({ action: 'created', item: created });
            }
          }
        });

        // enrich returned items with product data (best-effort)
        const enriched = await Promise.all(results.map(async r => {
          if (r.item?.cartId) {
            const withProduct = await prisma.cart.findUnique({
              where: { cartId: r.item.cartId },
              include: { product: true }
            });
            return { ...r, item: withProduct };
          }
          return r;
        }));

        return res.status(200).json({ results: enriched });
      }

      // SINGLE ITEM (product page) MODE
      if (!productId) return res.status(400).json({ error: 'productId required' });
      const pId = parseInt(productId, 10);
      const qty = Math.max(1, parseInt(quantity, 10));

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.products.findUnique({ where: { productId: pId } });
        if (!product) throw { status: 404, message: 'Product not found' };

        const existing = await tx.cart.findFirst({
          where: { productId: pId, ...(userId ? { userId } : { sessionId }) }
        });

        if (existing) {
          // For product page UX: do NOT increment; inform frontend it already exists
          return { action: 'exists', item: existing };
        }

        if (qty > product.productStock) {
          throw { status: 400, message: `Only ${product.productStock} units available` };
        }

        const created = await tx.cart.create({
          data: {
            productId: pId,
            quantity: qty,
            ...(userId ? { userId } : { sessionId })
          }
        });

        return { action: 'created', item: created };
      });

      // include product details in response
      if (result.item?.cartId) {
        const itemWithProduct = await prisma.cart.findUnique({
          where: { cartId: result.item.cartId },
          include: { product: true }
        });
        return res.status(result.action === 'created' ? 201 : 200).json({ action: result.action, item: itemWithProduct });
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
