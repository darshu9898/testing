import { getContext } from '@/lib/getContext'
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  try {
    // Add request logging (remove in production)
    // console.log("📩 Cart API:", req.method, "from", req.headers['user-agent']?.substring(0, 50))

    // Use secure context instead of query parameters
    const { userId, sessionId, isAuthenticated } = await getContext(req, res)

    // --- build where clause ---
    const ownerWhere = {}
    if (userId) {
      ownerWhere.userId = userId
    } else if (sessionId) {
      ownerWhere.sessionId = sessionId
    } else {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // ---------------- GET CART ----------------
    if (req.method === 'GET') {
      const rows = await prisma.cart.findMany({
        where: ownerWhere,
        include: { product: true },
        orderBy: { cartId: 'asc' },
      })

      const items = rows.map(r => ({
        cartId: r.cartId,
        productId: r.productId,
        quantity: r.quantity,
        product: r.product,
        itemTotal: r.product.productPrice * r.quantity,
      }))

      const grandTotal = items.reduce((sum, it) => sum + it.itemTotal, 0)

      // Set cache control to prevent excessive requests
      res.setHeader('Cache-Control', 'private, max-age=60') // Cache for 1 minute
      return res.status(200).json({ items, grandTotal })
    }

    // ---------------- ADD SINGLE ITEM ----------------
    if (req.method === 'POST') {
      const { productId, quantity = 1 } = req.body

      if (!productId) {
        return res.status(400).json({ error: 'productId required' })
      }

      const pId = parseInt(productId, 10)
      const qty = Math.max(1, parseInt(quantity, 10))

      const result = await prisma.$transaction(async tx => {
        const product = await tx.products.findUnique({ where: { productId: pId } })
        if (!product) throw { status: 404, message: 'Product not found' }

        const existing = await tx.cart.findFirst({
          where: { 
            productId: pId, 
            ...(userId ? { userId } : { sessionId })
          },
        })

        if (existing) {
          return { action: 'exists', item: existing }
        }

        if (qty > product.productStock) {
          throw { status: 400, message: `Only ${product.productStock} units available` }
        }

        const created = await tx.cart.create({
          data: {
            productId: pId,
            quantity: qty,
            ...(userId ? { userId } : { sessionId }),
          },
        })

        return { action: 'created', item: created }
      })

      if (result.item?.cartId) {
        const itemWithProduct = await prisma.cart.findUnique({
          where: { cartId: result.item.cartId },
          include: { product: true },
        })

        return res
          .status(result.action === 'created' ? 201 : 200)
          .json({ action: result.action, item: itemWithProduct })
      }

      return res.status(200).json(result)
    }

    // ---------------- INVALID METHOD ----------------
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err) {
    console.error("Cart API Error:", err)
    if (err?.status) return res.status(err.status).json({ error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
}