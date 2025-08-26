// src/pages/api/admin/userid.js
import prisma from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/adminAuth'

export default async function handler(req, res) {
  try {
    const { userId } = req.query

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid userId required' })
    }

    const userIdInt = parseInt(userId)

    // ============== GET: Single User Details ==============
    if (req.method === 'GET') {
      // Check admin authentication
      if (!requireAdminAuth(req, res)) {
        return // requireAdminAuth already sent the error response
      }

      const user = await prisma.users.findUnique({
        where: { userId: userIdInt },
        include: {
          orders: {
            include: {
              orderDetails: {
                include: {
                  product: true
                }
              },
              payments: true
            },
            orderBy: {
              orderDate: 'desc'
            }
          },
          reviews: {
            include: {
              product: true
            },
            orderBy: {
              reviewId: 'desc'
            }
          },
          cart: {
            include: {
              product: true
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Calculate summary statistics
      const totalSpent = user.orders.reduce((sum, order) => sum + order.orderAmount, 0)
      const totalItemsPurchased = user.orders.reduce((sum, order) => {
        return sum + order.orderDetails.reduce((itemSum, detail) => itemSum + detail.quantity, 0)
      }, 0)

      const ordersByStatus = user.orders.reduce((acc, order) => {
        const hasPayment = order.payments.length > 0
        const paymentStatus = hasPayment ? order.payments[0].paymentStatus : 'pending'
        acc[paymentStatus] = (acc[paymentStatus] || 0) + 1
        return acc
      }, {})

      return res.status(200).json({
        success: true,
        user: {
          ...user,
          summary: {
            totalOrders: user.orders.length,
            totalSpent,
            totalItemsPurchased,
            totalReviews: user.reviews.length,
            activeCartItems: user.cart.length,
            ordersByStatus
          }
        }
      })
    }

    // ============== PUT: Update User Details ==============
    if (req.method === 'PUT') {
      // Check admin authentication
      if (!requireAdminAuth(req, res)) {
        return // requireAdminAuth already sent the error response
      }

      const { 
        userName, 
        userEmail, 
        userPhone, 
        userAddress 
      } = req.body

      // Validation
      if (!userName && !userEmail && !userPhone && !userAddress) {
        return res.status(400).json({ 
          error: 'At least one field (userName, userEmail, userPhone, userAddress) is required' 
        })
      }

      // Email validation if provided
      if (userEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(userEmail)) {
          return res.status(400).json({ error: 'Invalid email format' })
        }
      }

      // Phone validation if provided
      if (userPhone && (isNaN(userPhone) || userPhone < 0)) {
        return res.status(400).json({ error: 'Invalid phone number' })
      }

      // Build update data object
      const updateData = {}
      if (userName) updateData.userName = userName.trim()
      if (userEmail) updateData.userEmail = userEmail.trim().toLowerCase()
      if (userPhone !== undefined) updateData.userPhone = userPhone ? parseInt(userPhone) : null
      if (userAddress !== undefined) updateData.userAddress = userAddress ? userAddress.trim() : null

      try {
        // Update user
        const updatedUser = await prisma.users.update({
          where: { userId: userIdInt },
          data: updateData,
          include: {
            _count: {
              select: {
                orders: true,
                reviews: true,
                cart: true
              }
            }
          }
        })

        return res.status(200).json({
          success: true,
          message: 'User updated successfully',
          user: updatedUser
        })

      } catch (dbError) {
        // Handle unique constraint violations
        if (dbError.code === 'P2002') {
          const field = dbError.meta?.target?.includes('userEmail') ? 'email' : 'field'
          return res.status(400).json({ 
            error: `This ${field} is already taken by another user` 
          })
        }
        
        if (dbError.code === 'P2025') {
          return res.status(404).json({ error: 'User not found' })
        }

        throw dbError
      }
    }

    // ============== DELETE: Delete User (Optional) ==============
    if (req.method === 'DELETE') {
      // Check admin authentication
      if (!requireAdminAuth(req, res)) {
        return // requireAdminAuth already sent the error response
      }

      // Check if user exists
      const existingUser = await prisma.users.findUnique({
        where: { userId: userIdInt },
        include: {
          _count: {
            select: {
              orders: true,
              reviews: true,
              cart: true
            }
          }
        }
      })

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Prevent deletion if user has orders (business rule)
      if (existingUser._count.orders > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete user with existing orders. Consider deactivating instead.' 
        })
      }

      // Delete user (this will cascade delete cart items due to foreign key)
      await prisma.users.delete({
        where: { userId: userIdInt }
      })

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Admin userid error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}