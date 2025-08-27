// 3. Enhanced admin userdetails API - src/pages/api/admin/userdetails.js
// src/pages/api/admin/userdetails.js
import prisma from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/adminAuth'

function replacer(key, value) {
  return typeof value === 'bigint' ? value.toString() : value
}

export default async function handler(req, res) {
  console.log(`📥 Admin userdetails request: ${req.method} ${req.url}`)
  
  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Check admin authentication
    if (!requireAdminAuth(req, res)) {
      return // requireAdminAuth already sent the error response
    }

    console.log('🔍 Fetching users from database...')

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

    console.log(`📊 Found ${users.length} users`)

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

    console.log('✅ Users data processed successfully')

return res
  .status(200)
  .setHeader('Content-Type', 'application/json')
  .send(JSON.stringify({
    success: true,
    totalUsers: users.length,
    users: userSummary
  }, replacer))
  } catch (error) {
    console.error('💥 Admin userdetails error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}