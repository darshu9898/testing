// src/pages/api/cart/index.js - Ultra-optimized version
import { getContext } from '@/lib/getContext'
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  const startTime = Date.now()
  
  try {
    console.log(`🛒 Cart API ${req.method} started`)
    
    // Use optimized context
    const contextStart = Date.now()
    const { userId, sessionId, isAuthenticated } = await getContext(req, res)
    console.log(`⚡ Context: ${Date.now() - contextStart}ms`)

    // Build where clause
    const ownerWhere = userId ? { userId } : { sessionId }
    
    if (!userId && !sessionId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // ---------------- GET CART (OPTIMIZED) ----------------
    if (req.method === 'GET') {
      const dbStart = Date.now()
      
      // Single optimized query with selective fields only
      const cartItems = await prisma.cart.findMany({
        where: ownerWhere,
        select: {
          cartId: true,
          productId: true,
          quantity: true,
          product: {
            select: {
              productId: true,
              productName: true,
              productPrice: true,
              productStock: true,
              productImage: true
            }
          }
        },
        orderBy: { cartId: 'desc' } // Most recent first
      })
      
      console.log(`💾 Cart query: ${Date.now() - dbStart}ms`)

      // Calculate totals efficiently in memory
      let grandTotal = 0
      const items = cartItems.map(item => {
        const itemTotal = item.product.productPrice * item.quantity
        grandTotal += itemTotal
        return {
          cartId: item.cartId,
          productId: item.productId,
          quantity: item.quantity,
          product: item.product,
          itemTotal
        }
      })

      console.log(`✅ Cart GET total: ${Date.now() - startTime}ms`)
      
      // Cache for 30 seconds to reduce repeated calls
      res.setHeader('Cache-Control', 'private, max-age=30')
      
      return res.status(200).json({ 
        items, 
        grandTotal,
        itemCount: items.length 
      })
    }

    // ---------------- ADD TO CART (OPTIMIZED) ----------------
    if (req.method === 'POST') {
      const { productId, quantity = 1 } = req.body

      if (!productId) {
        return res.status(400).json({ error: 'productId required' })
      }

      const pId = parseInt(productId, 10)
      const qty = Math.max(1, parseInt(quantity, 10))

      const dbStart = Date.now()

      // Single transaction with optimized queries
      const result = await prisma.$transaction(async (tx) => {
        // Check product with minimal fields
        const product = await tx.products.findUnique({ 
          where: { productId: pId },
          select: { 
            productId: true, 
            productStock: true, 
            productName: true, 
            productPrice: true 
          }
        })
        
        if (!product) {
          throw { status: 404, message: 'Product not found' }
        }

        if (qty > product.productStock) {
          throw { status: 400, message: `Only ${product.productStock} units available` }
        }

        // Try to find existing cart item
        const existing = await tx.cart.findFirst({
          where: { 
            productId: pId, 
            ...ownerWhere
          },
          select: { cartId: true, quantity: true }
        })

        if (existing) {
          // Update existing quantity
          const newQuantity = existing.quantity + qty
          
          if (newQuantity > product.productStock) {
            throw { status: 400, message: `Cannot add ${qty} more. Maximum ${product.productStock} allowed` }
          }
          
          const updated = await tx.cart.update({
            where: { cartId: existing.cartId },
            data: { quantity: newQuantity },
            select: {
              cartId: true,
              productId: true,
              quantity: true,
              product: {
                select: {
                  productName: true,
                  productPrice: true,
                  productImage: true
                }
              }
            }
          })
          
          return { action: 'updated', item: updated }
        } else {
          // Create new cart item
          const created = await tx.cart.create({
            data: {
              productId: pId,
              quantity: qty,
              ...ownerWhere
            },
            select: {
              cartId: true,
              productId: true,
              quantity: true,
              product: {
                select: {
                  productName: true,
                  productPrice: true,
                  productImage: true
                }
              }
            }
          })
          
          return { action: 'created', item: created }
        }
      })

      console.log(`💾 Cart POST: ${Date.now() - dbStart}ms`)
      console.log(`✅ Cart POST total: ${Date.now() - startTime}ms`)

      // Add item total to response
      result.item.itemTotal = result.item.product.productPrice * result.item.quantity
      
      return res.status(result.action === 'created' ? 201 : 200).json(result)
    }

    return res.status(405).json({ error: 'Method not allowed' })

  }  catch (err) {
    console.error("❌ Cart API Error:", err)
    console.log(`💥 Cart API failed: ${Date.now() - startTime}ms`)
    
    if (err?.status) {
      return res.status(err.status).json({ error: err.message })
    }
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }

}
