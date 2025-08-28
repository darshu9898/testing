// src/pages/api/user/profile.js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User profile request: ${req.method} ${req.url}`)
  
  try {
    const { userId, user, isAuthenticated } = await getContext(req, res)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // ============== GET: Fetch User Profile ==============
    if (req.method === 'GET') {
      const userProfile = await prisma.users.findUnique({
        where: { userId: parseInt(userId) },
        select: {
          userId: true,
          supabaseId: true,
          userName: true,
          userEmail: true,
          userPhone: true,
          userAddress: true,
          created_at: true,
          _count: {
            select: {
              orders: true,
              reviews: true,
              cart: true
            }
          }
        }
      })

      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' })
      }

      // Get user statistics
      const orderStats = await prisma.orders.aggregate({
        where: { userId: parseInt(userId) },
        _sum: { orderAmount: true },
        _count: { orderId: true }
      })

      console.log(orderStats._count);

      // Get recent orders
      const recentOrders = await prisma.orders.findMany({
        where: { userId: parseInt(userId) },
        include: {
          orderDetails: {
            include: { product: { select: { productName: true, productImage: true } } }
          },
          payments: { select: { paymentStatus: true, paymentDate: true } }
        },
        orderBy: { orderDate: 'desc' },
        take: 3
      })


      console.log(orderStats._count.orderId);
      const profileData = {
        ...userProfile,
        statistics: {
          totalOrders: orderStats._count.orderId || 0,
          totalSpent: orderStats._sum.orderAmount || 0,
          totalReviews: userProfile._count.reviews,
          activeCartItems: userProfile._count.cart
        },
        recentOrders: recentOrders.map(order => ({
          orderId: order.orderId,
          orderDate: order.orderDate,
          orderAmount: order.orderAmount,
          itemCount: order.orderDetails.length,
          paymentStatus: order.payments[0]?.paymentStatus || 'pending',
          firstProductImage: order.orderDetails[0]?.product?.productImage || null
        }))
      }

      console.log(`✅ Profile fetched for user ${userId}`)

      return res.status(200).json({
        success: true,
        profile: profileData
      })
    }

    // ============== PUT: Update User Profile ==============
    if (req.method === 'PUT') {
      const { userName, userPhone, userAddress } = req.body

      // Validation
      if (!userName && userPhone === undefined && userAddress === undefined) {
        return res.status(400).json({ 
          error: 'At least one field (userName, userPhone, userAddress) is required' 
        })
      }

      // Build update data
      const updateData = {}
      if (userName) {
        if (userName.trim().length < 2) {
          return res.status(400).json({ error: 'Name must be at least 2 characters long' })
        }
        updateData.userName = userName.trim()
      }

      if (userPhone !== undefined) {
        if (userPhone && (isNaN(userPhone) || userPhone.toString().length < 10)) {
          return res.status(400).json({ error: 'Invalid phone number format' })
        }
        updateData.userPhone = userPhone ? BigInt(userPhone) : null
      }

      if (userAddress !== undefined) {
        updateData.userAddress = userAddress ? userAddress.trim() : null
      }

      try {
        const updatedProfile = await prisma.users.update({
          where: { userId: parseInt(userId) },
          data: updateData,
          select: {
            userId: true,
            userName: true,
            userEmail: true,
            userPhone: true,
            userAddress: true,
            created_at: true
          }
        })

        console.log(`✅ Profile updated for user ${userId}`)

        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          profile: {
            ...updatedProfile,
            userPhone: updatedProfile.userPhone?.toString() || null
          }
        })

      } catch (dbError) {
        if (dbError.code === 'P2025') {
          return res.status(404).json({ error: 'User not found' })
        }
        throw dbError
      }
    }

    // ============== DELETE: Delete User Account ==============
    if (req.method === 'DELETE') {
      const { confirmEmail } = req.body

      // Require email confirmation for account deletion
      if (!confirmEmail || confirmEmail !== user.email) {
        return res.status(400).json({ 
          error: 'Email confirmation required for account deletion' 
        })
      }

      // Check if user has pending orders
      const pendingOrders = await prisma.orders.count({
        where: { 
          userId: parseInt(userId),
          payments: {
            some: {
              paymentStatus: { in: ['pending', 'processing'] }
            }
          }
        }
      })

      if (pendingOrders > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete account with pending orders. Please contact support.' 
        })
      }

      try {
        // Delete user account and related data
        await prisma.$transaction(async (tx) => {
          // Delete cart items
          await tx.cart.deleteMany({ where: { userId: parseInt(userId) } })
          
          // Delete reviews
          await tx.reviews.deleteMany({ where: { userId: parseInt(userId) } })
          
          // Note: Orders and payments are kept for business records
          // Only delete the user record
          await tx.users.delete({ where: { userId: parseInt(userId) } })
        })

        console.log(`✅ User account deleted: ${userId}`)

        return res.status(200).json({
          success: true,
          message: 'Account deleted successfully'
        })

      } catch (dbError) {
        if (dbError.code === 'P2025') {
          return res.status(404).json({ error: 'User not found' })
        }
        throw dbError
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User profile error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}