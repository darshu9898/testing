// src/pages/api/user/reviews/[id].js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User review [id] request: ${req.method} ${req.url}`)
  
  try {
    const { userId, isAuthenticated } = await getContext(req, res)
    const reviewId = parseInt(req.query.id, 10)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!reviewId || isNaN(reviewId)) {
      return res.status(400).json({ error: 'Valid review ID required' })
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.reviews.findFirst({
      where: {
        reviewId,
        userId: parseInt(userId)
      },
      include: {
        product: {
          select: {
            productId: true,
            productName: true,
            productImage: true
          }
        }
      }
    })

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found or not authorized' })
    }

    // ============== GET: Fetch Single Review ==============
    if (req.method === 'GET') {
      console.log(`✅ Review fetched: ${reviewId} for user ${userId}`)

      return res.status(200).json({
        success: true,
        review: existingReview
      })
    }

    // ============== PUT: Update Review ==============
    if (req.method === 'PUT') {
      const { review } = req.body

      if (!review || review.trim().length < 5) {
        return res.status(400).json({ 
          error: 'Review content is required and must be at least 5 characters long' 
        })
      }

      const updatedReview = await prisma.reviews.update({
        where: { reviewId },
        data: { review: review.trim() },
        include: {
          product: {
            select: {
              productId: true,
              productName: true,
              productImage: true
            }
          }
        }
      })

      console.log(`✅ Review updated: ${reviewId} for user ${userId}`)

      return res.status(200).json({
        success: true,
        review: updatedReview,
        message: 'Review updated successfully'
      })
    }

    // ============== DELETE: Delete Review ==============
    if (req.method === 'DELETE') {
      await prisma.reviews.delete({
        where: { reviewId }
      })

      console.log(`✅ Review deleted: ${reviewId} for user ${userId}`)

      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User review [id] error:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Review not found' })
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}