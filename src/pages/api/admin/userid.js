// src/pages/api/admin/userid.js
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

      // Calculate summary statistics with BigInt handling
      const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.orderAmount || 0), 0)
      const totalItemsPurchased = user.orders.reduce((sum, order) => {
        return sum + order.orderDetails.reduce((itemSum, detail) => itemSum + detail.quantity, 0)
      }, 0)

      const ordersByStatus = user.orders.reduce((acc, order) => {
        const hasPayment = order.payments.length > 0
        const paymentStatus = hasPayment ? order.payments[0].paymentStatus : 'pending'
        acc[paymentStatus] = (acc[paymentStatus] || 0) + 1
        return acc
      }, {})

      // Prepare response with BigInt conversion
      const responseData = {
        success: true,
        user: {
          ...user,
          userPhone: user.userPhone ? user.userPhone.toString() : null, // Explicit BigInt conversion
          summary: {
            totalOrders: user.orders.length,
            totalSpent,
            totalItemsPurchased,
            totalReviews: user.reviews.length,
            activeCartItems: user.cart.length,
            ordersByStatus
          }
        }
      }

      // Deep convert any remaining BigInts
      const safeResponseData = convertBigInts(responseData)

      return res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .send(JSON.stringify(safeResponseData, replacer))
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
      if (!userName && !userEmail && userPhone === undefined && userAddress === undefined) {
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
      if (userPhone !== undefined && userPhone !== null && userPhone !== '') {
        const phoneStr = userPhone.toString()
        if (isNaN(phoneStr) || phoneStr < 0) {
          return res.status(400).json({ error: 'Invalid phone number' })
        }
      }

      // Build update data object
      const updateData = {}
      if (userName) updateData.userName = userName.trim()
      if (userEmail) updateData.userEmail = userEmail.trim().toLowerCase()
      
      // Handle BigInt phone number conversion
      if (userPhone !== undefined) {
        if (userPhone === null || userPhone === '') {
          updateData.userPhone = null
        } else {
          try {
            updateData.userPhone = BigInt(userPhone)
          } catch (e) {
            return res.status(400).json({ error: 'Invalid phone number format' })
          }
        }
      }
      
      if (userAddress !== undefined) {
        updateData.userAddress = userAddress ? userAddress.trim() : null
      }

      try {
        console.log('Updating user with data:', { ...updateData, userPhone: updateData.userPhone?.toString() })
        
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

        // Prepare response with BigInt conversion
        const responseData = {
          success: true,
          message: 'User updated successfully',
          user: {
            ...updatedUser,
            userPhone: updatedUser.userPhone ? updatedUser.userPhone.toString() : null
          }
        }

        // Deep convert any remaining BigInts
        const safeResponseData = convertBigInts(responseData)

        return res
          .status(200)
          .setHeader('Content-Type', 'application/json')
          .send(JSON.stringify(safeResponseData, replacer))

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
    
    // Handle BigInt errors in error responses
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