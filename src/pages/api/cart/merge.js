import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { userId, sessionId, isAuthenticated } = await getContext(req, res)

  if (!isAuthenticated || !userId || !sessionId) {
    return res.status(400).json({ error: 'User must be authenticated and have session' })
  }

  try {
    // Fetch guest cart items
    const guestItems = await prisma.cart.findMany({ 
      where: { sessionId },
      include: { product: true }
    })

    let mergedCount = 0

    for (const guestItem of guestItems) {
      // Check if user already has this product in their cart
      const existingUserItem = await prisma.cart.findFirst({
        where: { userId, productId: guestItem.productId }
      })

      if (existingUserItem) {
        // Update quantity (combine guest + user quantities)
        const newQuantity = existingUserItem.quantity + guestItem.quantity
        const maxStock = guestItem.product.productStock
        
        await prisma.cart.update({
          where: { cartId: existingUserItem.cartId },
          data: { quantity: Math.min(newQuantity, maxStock) }
        })
      } else {
        // Create new user cart item
        await prisma.cart.create({
          data: {
            userId,
            productId: guestItem.productId,
            quantity: guestItem.quantity
          }
        })
      }
      mergedCount++
    }

    // Remove all guest cart items
    await prisma.cart.deleteMany({ where: { sessionId } })

    res.status(200).json({ action: 'merged', itemsCount: mergedCount })
  } catch (error) {
    console.error('Cart merge error:', error)
    res.status(500).json({ error: 'Failed to merge cart' })
  }
}