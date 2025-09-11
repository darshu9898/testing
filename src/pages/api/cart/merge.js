// src/pages/api/cart/merge.js - Ultra-optimized version
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const startTime = Date.now()
  console.log('🔄 Cart Merge: Starting optimized merge process...')
  
  try {
    // Get context
    const contextStart = Date.now()
    const { userId, sessionId, isAuthenticated, user } = await getContext(req, res)
    console.log(`⚡ Context: ${Date.now() - contextStart}ms`)
    
    // Validate requirements
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!sessionId) {
      console.log('ℹ️ No guest session, skipping merge')
      return res.status(200).json({ 
        action: 'skipped', 
        message: 'No guest session found',
        itemsCount: 0 
      })
    }

    const dbStart = Date.now()

    // OPTIMIZED: Single transaction with bulk operations
    const result = await prisma.$transaction(async (tx) => {
      // Get all guest cart items with product info in ONE query
      const guestItems = await tx.cart.findMany({ 
        where: { sessionId },
        select: {
          productId: true,
          quantity: true,
          product: {
            select: {
              productId: true,
              productStock: true,
              productName: true
            }
          }
        }
      })

      if (guestItems.length === 0) {
        return { action: 'skipped', itemsCount: 0 }
      }

      console.log(`📦 Found ${guestItems.length} guest items`)

      // Get existing user cart items in ONE query
      const productIds = guestItems.map(item => item.productId)
      const existingUserItems = await tx.cart.findMany({
        where: { 
          userId, 
          productId: { in: productIds }
        },
        select: {
          cartId: true,
          productId: true,
          quantity: true
        }
      })

      // Create maps for efficient lookups
      const existingItemsMap = new Map()
      existingUserItems.forEach(item => {
        existingItemsMap.set(item.productId, item)
      })

      // Process items efficiently
      const updateOperations = []
      const createOperations = []
      let mergedCount = 0
      const warnings = []

      for (const guestItem of guestItems) {
        const existing = existingItemsMap.get(guestItem.productId)
        const maxStock = guestItem.product.productStock
        
        if (existing) {
          // Update existing item
          const newQuantity = Math.min(
            existing.quantity + guestItem.quantity,
            maxStock
          )
          
          updateOperations.push({
            where: { cartId: existing.cartId },
            data: { quantity: newQuantity }
          })
          
          if (newQuantity < existing.quantity + guestItem.quantity) {
            warnings.push(`Limited ${guestItem.product.productName} to ${newQuantity} (max stock)`)
          }
        } else {
          // Create new item
          const finalQuantity = Math.min(guestItem.quantity, maxStock)
          
          createOperations.push({
            userId,
            productId: guestItem.productId,
            quantity: finalQuantity
          })
          
          if (finalQuantity < guestItem.quantity) {
            warnings.push(`Limited ${guestItem.product.productName} to ${finalQuantity} (max stock)`)
          }
        }
        mergedCount++
      }

      // BULK OPERATIONS - Much faster than individual queries
      if (updateOperations.length > 0) {
        await Promise.all(
          updateOperations.map(op => 
            tx.cart.update(op)
          )
        )
        console.log(`🔄 Bulk updated ${updateOperations.length} items`)
      }

      if (createOperations.length > 0) {
        await tx.cart.createMany({
          data: createOperations
        })
        console.log(`➕ Bulk created ${createOperations.length} items`)
      }

      // Delete all guest items in one operation
      const deleteResult = await tx.cart.deleteMany({ 
        where: { sessionId } 
      })
      console.log(`🗑️ Deleted ${deleteResult.count} guest items`)

      return {
        action: 'merged',
        itemsCount: mergedCount,
        details: {
          updated: updateOperations.length,
          created: createOperations.length,
          deletedGuestItems: deleteResult.count
        },
        warnings
      }
    })

    console.log(`💾 Database operations: ${Date.now() - dbStart}ms`)
    console.log(`✅ Cart merge total: ${Date.now() - startTime}ms`)

    return res.status(200).json(result)

  } catch (error) {
    console.error('💥 Cart merge error:', error)
    console.log(`❌ Cart merge failed: ${Date.now() - startTime}ms`)
    
    return res.status(500).json({
      error: 'Failed to merge cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
