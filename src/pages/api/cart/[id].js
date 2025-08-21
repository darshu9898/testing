import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  try {
    // Use secure context instead of query parameters
    const { userId, sessionId } = await getContext(req, res)
    const productId = parseInt(req.query.id, 10)

    if (!userId && !sessionId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!productId) {
      return res.status(400).json({ error: 'Product id required' })
    }

    // Build where clause based on authentication status
    const ownerWhere = userId ? { userId } : { sessionId }

    // ---------------- PATCH: update quantity ----------------
    if (req.method === 'PATCH') {
      const { quantity, delta } = req.body

      const product = await prisma.products.findUnique({
        where: { productId },
      })
      if (!product) return res.status(404).json({ error: 'Product not found' })

      // Find cart row for this user/session and product
      const existing = await prisma.cart.findFirst({
        where: { ...ownerWhere, productId },
      })

      if (!existing) {
        return res.status(404).json({ error: 'Cart item not found' })
      }

      let newQty
      if (typeof quantity !== 'undefined') {
        newQty = parseInt(quantity, 10)
      } else if (typeof delta !== 'undefined') {
        newQty = existing.quantity + parseInt(delta, 10)
      } else {
        return res.status(400).json({ error: 'Provide quantity or delta in body' })
      }

      if (newQty <= 0) {
        await prisma.cart.delete({ where: { cartId: existing.cartId } })
        return res.status(200).json({ action: 'deleted', message: 'Item removed from cart' })
      }

      if (newQty > product.productStock) {
        return res.status(400).json({ error: `Only ${product.productStock} units available` })
      }

      const updated = await prisma.cart.update({
        where: { cartId: existing.cartId },
        data: { quantity: newQty },
        include: { product: true },
      })

      return res.status(200).json({ action: 'updated', item: updated })
    }

    // ---------------- DELETE: remove item ----------------
    if (req.method === 'DELETE') {
      const existing = await prisma.cart.findFirst({
        where: { ...ownerWhere, productId },
      })

      if (!existing) {
        return res.status(404).json({ error: 'Cart item not found' })
      }

      await prisma.cart.delete({ where: { cartId: existing.cartId } })
      return res.status(200).json({ action: 'deleted', productId })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    if (err?.status) return res.status(err.status).json({ error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
