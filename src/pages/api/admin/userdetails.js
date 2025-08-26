// src/pages/api/admin/userdetails.js
import prisma from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/adminAuth'

export default async function handler(req, res) {
  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Check admin authentication
    if (!requireAdminAuth(req, res)) {
      return // requireAdminAuth already sent the error response
    }

    // Get all users with their order summary
    const users = await prisma.users.findMany({
      include: {
        orders: {
          include: {
            orderDetails: {
              include: {
                product: true
              }
            },
            payments: true
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform data to include useful summary info
    const userSummary = users.map(user => {
      const totalSpent = user.orders.reduce((sum, order) => sum + order.orderAmount, 0)
      const lastOrderDate = user.orders.length > 0 
        ? user.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))[0].orderDate
        : null

      return {
        userId: user.userId,
        supabaseId: user.supabaseId,
        userName: user.userName,
        userEmail: user.userEmail,
        userPhone: user.userPhone,
        userAddress: user.userAddress,
        created_at: user.created_at,
        totalOrders: user._count.orders,
        totalReviews: user._count.reviews,
        totalSpent,
        lastOrderDate,
        isActive: user.orders.length > 0 // Has made at least one order
      }
    })

    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      users: userSummary
    })

  } catch (error) {
    console.error('Admin userdetails error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}