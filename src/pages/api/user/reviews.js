// src/pages/api/user/reviews.js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User reviews request: ${req.method} ${req.url}`)
  
  try {
    const { userId, user, isAuthenticated } = await getContext(req, res)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // ============== GET: Fetch User's Reviews ==============
    if (req.method === 'GET') {
      const { productId, limit = 20, offset = 0 } = req.query

      const where = { userId: parseInt(userId) }
      if (productId) where.productId = parseInt(productId, 10)

      const reviews = await prisma.reviews.findMany({
        where,
        include: {
          product: {
            select: {
              productId: true,
              productName: true,
              productImage: true,
              productPrice: true
            }
          }
        },
        orderBy: { reviewId: 'desc' },
        take: Math.min(parseInt(limit, 10), 50),
        skip: parseInt(offset, 10) || 0
      })

      const totalReviews = await prisma.reviews.count({ where })

      console.log(`📊 Found ${reviews.length} reviews for user ${userId}`)

      return res.status(200).json({
        success: true,
        reviews: reviews.map(review => ({
          reviewId: review.reviewId,
          productId: review.productId,
          review: review.review,
          product: review.product
        })),
        pagination: {
          currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalItems: totalReviews,
          itemsPerPage: parseInt(limit)
        }
      })
    }

    // ============== POST: Create New Review ==============
    if (req.method === 'POST') {
      const { productId, review } = req.body

      if (!productId || !review) {
        return res.status(400).json({ error: 'Product ID and review content are required' })
      }

      if (review.trim().length < 5) {
        return res.status(400).json({ error: 'Review must be at least 5 characters long' })
      }

      // Check if product exists
      const product = await prisma.products.findUnique({
        where: { productId: parseInt(productId, 10) },
        select: { productId: true, productName: true }
      })

      if (!product) {
        return res.status(404).json({ error: 'Product not found' })
      }

      // Check if user has purchased this product
      const hasPurchased = await prisma.orderDetails.findFirst({
        where: {
          productId: parseInt(productId, 10),
          order: { userId: parseInt(userId) }
        }
      })

      if (!hasPurchased) {
        return res.status(400).json({ 
          error: 'You can only review products you have purchased' 
        })
      }

      // Check if user already reviewed this product
      const existingReview = await prisma.reviews.findFirst({
        where: {
          userId: parseInt(userId),
          productId: parseInt(productId, 10)
        }
      })

      if (existingReview) {
        return res.status(400).json({ 
          error: 'You have already reviewed this product' 
        })
      }

      // Create review
      const newReview = await prisma.reviews.create({
        data: {
          userId: parseInt(userId),
          productId: parseInt(productId, 10),
          review: review.trim()
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

      console.log(`✅ Review created for user ${userId} on product ${productId}`)

      return res.status(201).json({
        success: true,
        review: newReview,
        message: 'Review submitted successfully'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User reviews error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}