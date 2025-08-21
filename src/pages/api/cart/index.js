import { getContext } from '@/lib/getContext'
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  try {
    console.log("📩 Incoming request:", req.method, req.query, req.body)

    // Use secure context instead of query parameters
    const { userId, sessionId, isAuthenticated } = await getContext(req, res)
    console.log("➡️ Context -> userId:", userId, "sessionId:", sessionId, "authenticated:", isAuthenticated)

    // --- build where clause ---
    const ownerWhere = {}
    if (userId) {
      ownerWhere.userId = userId
    } else if (sessionId) {
      ownerWhere.sessionId = sessionId
    } else {
      console.log("❌ Missing userId & sessionId")
      return res.status(401).json({ error: 'Authentication required' })
    }

    console.log("🔎 ownerWhere:", ownerWhere)

    // ---------------- GET CART ----------------
    if (req.method === 'GET') {
      console.log("🚀 Handling GET /cart")

      const rows = await prisma.cart.findMany({
        where: ownerWhere,
        include: { product: true },
        orderBy: { cartId: 'asc' },
      })
      console.log("📦 Cart rows:", rows)

      const items = rows.map(r => ({
        cartId: r.cartId,
        productId: r.productId,
        quantity: r.quantity,
        product: r.product,
        itemTotal: r.product.productPrice * r.quantity,
      }))
      console.log("🛍️ Processed items:", items)

      const grandTotal = items.reduce((sum, it) => sum + it.itemTotal, 0)
      console.log("💰 Grand total:", grandTotal)

      return res.status(200).json({ items, grandTotal })
    }

    // ---------------- ADD SINGLE ITEM ----------------
    if (req.method === 'POST') {
      console.log("🚀 Handling POST /cart")

      const { productId, quantity = 1 } = req.body
      console.log("➡️ Body productId:", productId, "quantity:", quantity)

      if (!productId) {
        console.log("❌ No productId provided")
        return res.status(400).json({ error: 'productId required' })
      }

      const pId = parseInt(productId, 10)
      const qty = Math.max(1, parseInt(quantity, 10))
      console.log("🔢 Parsed productId:", pId, "qty:", qty)

      const result = await prisma.$transaction(async tx => {
        console.log("🚦 Inside transaction")

        const product = await tx.products.findUnique({ where: { productId: pId } })
        console.log("🛒 Found product:", product)

        if (!product) throw { status: 404, message: 'Product not found' }

        const existing = await tx.cart.findFirst({
          where: { 
            productId: pId, 
            ...(userId ? { userId } : { sessionId })
          },
        })
        console.log("📦 Existing cart item:", existing)

        if (existing) {
          console.log("⚠️ Already exists in cart")
          return { action: 'exists', item: existing }
        }

        if (qty > product.productStock) {
          console.log("❌ Not enough stock. Requested:", qty, "Available:", product.productStock)
          throw { status: 400, message: `Only ${product.productStock} units available` }
        }

        const created = await tx.cart.create({
          data: {
            productId: pId,
            quantity: qty,
            ...(userId ? { userId } : { sessionId }),
          },
        })
        console.log("✅ Created cart item:", created)

        return { action: 'created', item: created }
      })

      console.log("🎯 Transaction result:", result)

      if (result.item?.cartId) {
        const itemWithProduct = await prisma.cart.findUnique({
          where: { cartId: result.item.cartId },
          include: { product: true },
        })
        console.log("📦 Returning item with product:", itemWithProduct)

        return res
          .status(result.action === 'created' ? 201 : 200)
          .json({ action: result.action, item: itemWithProduct })
      }

      return res.status(200).json(result)
    }

    // ---------------- INVALID METHOD ----------------
    console.log("❌ Method not allowed:", req.method)
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err) {
    console.error("🔥 API Error:", err)
    if (err?.status) return res.status(err.status).json({ error: err.message })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
