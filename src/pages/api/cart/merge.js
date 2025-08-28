// src/pages/api/cart/merge.js - Enhanced cart merge with better error handling
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  console.log('🛒 Cart Merge: Starting cart merge process...')
  
  try {
    // Get context with enhanced debugging
    const { userId, sessionId, isAuthenticated, user } = await getContext(req, res)
    
    console.log('🛒 Cart Merge: Context received:', {
      userId,
      sessionId: sessionId?.substring(0, 8) + '...',
      isAuthenticated,
      userEmail: user?.email
    })

    // Validate authentication and session requirements
    if (!isAuthenticated) {
      console.log('❌ Cart Merge: User not authenticated')
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!userId) {
      console.log('❌ Cart Merge: No userId found')
      return res.status(400).json({ error: 'User ID not found' })
    }

    if (!sessionId) {
      console.log('ℹ️ Cart Merge: No guest session found, nothing to merge')
      return res.status(200).json({ 
        action: 'skipped', 
        message: 'No guest session found',
        itemsCount: 0 
      })
    }

    // Check if there are any guest cart items
    const guestItems = await prisma.cart.findMany({ 
      where: { sessionId },
      include: { product: true }
    })

    console.log(`🛒 Cart Merge: Found ${guestItems.length} guest cart items`)

    if (guestItems.length === 0) {
      console.log('ℹ️ Cart Merge: No guest cart items to merge')
      return res.status(200).json({ 
        action: 'skipped', 
        message: 'No guest cart items found',
        itemsCount: 0 
      })
    }

    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      let mergedCount = 0
      let updatedCount = 0
      let createdCount = 0
      const errors = []

      for (const guestItem of guestItems) {
        try {
          // Validate product still exists and has stock
          const product = await tx.products.findUnique({
            where: { productId: guestItem.productId }
          })

          if (!product) {
            console.warn(`⚠️ Cart Merge: Product ${guestItem.productId} not found, skipping`)
            errors.push(`Product ${guestItem.productId} no longer exists`)
            continue
          }

          // Check if user already has this product in their cart
          const existingUserItem = await tx.cart.findFirst({
            where: { 
              userId, 
              productId: guestItem.productId 
            }
          })

          if (existingUserItem) {
            // Update quantity (combine guest + user quantities)
            const newQuantity = existingUserItem.quantity + guestItem.quantity
            const maxStock = product.productStock
            const finalQuantity = Math.min(newQuantity, maxStock)
            
            await tx.cart.update({
              where: { cartId: existingUserItem.cartId },
              data: { quantity: finalQuantity }
            })

            console.log(`🔄 Cart Merge: Updated existing item ${product.productName}: ${existingUserItem.quantity} + ${guestItem.quantity} = ${finalQuantity}`)
            
            updatedCount++
            mergedCount++

            if (finalQuantity < newQuantity) {
              errors.push(`Limited ${product.productName} to ${finalQuantity} (max stock: ${maxStock})`)
            }
          } else {
            // Create new user cart item
            const finalQuantity = Math.min(guestItem.quantity, product.productStock)
            
            await tx.cart.create({
              data: {
                userId,
                productId: guestItem.productId,
                quantity: finalQuantity
              }
            })

            console.log(`➕ Cart Merge: Created new item ${product.productName}: ${finalQuantity} units`)
            
            createdCount++
            mergedCount++

            if (finalQuantity < guestItem.quantity) {
              errors.push(`Limited ${product.productName} to ${finalQuantity} (max stock: ${product.productStock})`)
            }
          }
        } catch (itemError) {
          console.error(`❌ Cart Merge: Error processing item ${guestItem.productId}:`, itemError)
          errors.push(`Failed to process ${guestItem.product?.productName || `product ${guestItem.productId}`}`)
        }
      }

      // Remove all guest cart items after successful merge
      const deleteResult = await tx.cart.deleteMany({ 
        where: { sessionId } 
      })

      console.log(`🗑️ Cart Merge: Deleted ${deleteResult.count} guest cart items`)

      return {
        mergedCount,
        updatedCount,
        createdCount,
        deletedGuestItems: deleteResult.count,
        errors
      }
    })

    // Prepare response
    const response = {
      action: 'merged',
      itemsCount: result.mergedCount,
      details: {
        updated: result.updatedCount,
        created: result.createdCount,
        deletedGuestItems: result.deletedGuestItems
      }
    }

    if (result.errors.length > 0) {
      response.warnings = result.errors
    }

    console.log('✅ Cart Merge: Successfully completed:', response)
    
    return res.status(200).json(response)

  } catch (error) {
    console.error('💥 Cart Merge: Fatal error:', error)
    
    // Provide specific error details in development
    const errorResponse = {
      error: 'Failed to merge cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
    
    return res.status(500).json(errorResponse)
  }
}