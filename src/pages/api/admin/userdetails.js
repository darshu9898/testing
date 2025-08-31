// src/pages/api/admin/userdetails.js
import prisma from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/adminAuth'

// Generic BigInt serialization fix - works across all machines/Node versions
function replacer(key, value) {
  return typeof value === 'bigint' ? value.toString() : value
}

// Deep convert BigInt to string in nested objects
function convertBigInts(obj) {
  if (obj === null || obj === undefined) return obj
  
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts)
  }
  
  if (typeof obj === 'object') {
    const converted = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigInts(value)
    }
    return converted
  }
  
  return obj
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

    // Transform data to include useful summary info AND convert BigInts
    const userSummary = users.map(user => {
      const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.orderAmount || 0), 0)
      const lastOrderDate = user.orders.length > 0 
        ? user.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))[0].orderDate
        : null

      return {
        userId: user.userId,
        supabaseId: user.supabaseId,
        userName: user.userName,
        userEmail: user.userEmail,
        userPhone: user.userPhone ? user.userPhone.toString() : null, // Explicit BigInt conversion
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

    // Prepare response data with BigInt handling
    const responseData = {
      success: true,
      totalUsers: users.length,
      users: userSummary
    }

    // Convert any remaining BigInts deep in the object
    const safeResponseData = convertBigInts(responseData)

    // Use our custom replacer as backup for JSON.stringify
    const jsonString = JSON.stringify(safeResponseData, replacer)

    return res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .send(jsonString)

  } catch (error) {
    console.error('💥 Admin userdetails error:', error)
    
    // Also handle BigInt errors in error responses
    const errorResponse = { 
      error: 'Internal server error',
      message: error.message 
    }
    
    return res
      .status(500)
      .setHeader('Content-Type', 'application/json')
      .send(JSON.stringify(errorResponse, replacer))
  }
}