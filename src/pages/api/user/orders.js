// src/pages/api/user/orders.js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User orders request: ${req.method} ${req.url}`)
  
  try {
    const { userId, user, isAuthenticated } = await getContext(req, res)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // ============== GET: Fetch User's Orders ==============
    if (req.method === 'GET') {
      const { 
        orderId, 
        status, 
        limit = 20, 
        offset = 0,
        sortBy = 'orderDate',
        sortOrder = 'desc'
      } = req.query

      console.log('🔍 Fetching orders for user:', userId, { orderId, status, limit })

      // Build where clause
      const where = { userId: parseInt(userId) }
      if (orderId) where.orderId = parseInt(orderId, 10)

      // Build orderBy clause
      const validSortFields = ['orderDate', 'orderAmount', 'orderId']
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'orderDate'
      const orderBy = { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' }

      const orders = await prisma.orders.findMany({
        where,
        include: {
          user: {
            select: {
              userId: true,
              userName: true,
              userEmail: true,
              userAddress: true
            }
          },
          orderDetails: {
            include: {
              product: {
                select: {
                  productId: true,
                  productName: true,
                  productPrice: true,
                  productImage: true,
                  productDescription: true
                }
              }
            },
            orderBy: { orderDetailId: 'asc' }
          },
          payments: {
            orderBy: { paymentDate: 'desc' }
          }
        },
        orderBy,
        take: Math.min(parseInt(limit, 10), 50), // Max 50 orders per request
        skip: parseInt(offset, 10) || 0
      })

      // Transform data with summary info
      const ordersWithSummary = orders.map(order => {
        const totalItems = order.orderDetails.reduce((sum, detail) => sum + detail.quantity, 0)
        const lastPayment = order.payments.length > 0 ? order.payments[0] : null
        const paymentStatus = lastPayment?.paymentStatus || 'pending'

        // Calculate order status based on payment
        let orderStatus = 'pending'
        if (paymentStatus === 'paid' || paymentStatus === 'completed') {
          orderStatus = 'confirmed'
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
          orderStatus = 'failed'
        }

        return {
          orderId: order.orderId,
          orderAmount: order.orderAmount,
          orderDate: order.orderDate,
          totalItems,
          orderStatus,
          paymentStatus,
          items: order.orderDetails.map(detail => ({
            orderDetailId: detail.orderDetailId,
            productId: detail.productId,
            productName: detail.product.productName,
            productImage: detail.product.productImage,
            productDescription: detail.product.productDescription,
            quantity: detail.quantity,
            unitPrice: detail.productPrice,
            lineTotal: detail.productPrice * detail.quantity
          })),
          payments: order.payments.map(payment => ({
            paymentId: payment.paymentId,
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: payment.razorpayPaymentId,
            paymentMode: payment.paymentMode,
            paymentStatus: payment.paymentStatus,
            paymentAmount: payment.paymentAmount,
            paymentDate: payment.paymentDate
          })),
          shippingAddress: order.user.userAddress
        }
      })

      // Get total count for pagination
      const totalOrders = await prisma.orders.count({ where })

      // Calculate summary statistics
      const summary = {
        totalOrders,
        totalValue: ordersWithSummary.reduce((sum, order) => sum + order.orderAmount, 0),
        confirmedOrders: ordersWithSummary.filter(o => o.orderStatus === 'confirmed').length,
        pendingOrders: ordersWithSummary.filter(o => o.orderStatus === 'pending').length,
        failedOrders: ordersWithSummary.filter(o => o.orderStatus === 'failed').length
      }

      console.log(`📊 Found ${orders.length} orders for user ${userId}`)

      return res.status(200).json({
        success: true,
        orders: ordersWithSummary,
        summary,
        pagination: {
          currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalItems: totalOrders,
          itemsPerPage: parseInt(limit)
        }
      })
    }

    // ============== POST: Create New Order (from Cart) ==============
    if (req.method === 'POST') {
      const { shippingAddress, paymentMethod = 'razorpay' } = req.body

      if (!shippingAddress) {
        return res.status(400).json({ error: 'Shipping address is required' })
      }

      // Get user's cart items
      const cartItems = await prisma.cart.findMany({
        where: { userId: parseInt(userId) },
        include: { product: true }
      })

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' })
      }

      // Check stock availability
      for (const item of cartItems) {
        if (item.quantity > item.product.productStock) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${item.product.productName}. Only ${item.product.productStock} available.` 
          })
        }
      }

      // Calculate total amount
      const orderAmount = cartItems.reduce((total, item) => {
        return total + (item.product.productPrice * item.quantity)
      }, 0)

      // Create order with transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.orders.create({
          data: {
            userId: parseInt(userId),
            orderAmount,
            orderDate: new Date(),
            orderDetails: {
              create: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                productPrice: item.product.productPrice
              }))
            }
          },
          include: {
            orderDetails: { include: { product: true } },
            user: { select: { userName: true, userEmail: true } }
          }
        })

        // Update product stock
        for (const item of cartItems) {
          await tx.products.update({
            where: { productId: item.productId },
            data: { productStock: { decrement: item.quantity } }
          })
        }

        // Clear user's cart
        await tx.cart.deleteMany({
          where: { userId: parseInt(userId) }
        })

        return order
      })

      // Update user's shipping address if provided
      if (shippingAddress) {
        await prisma.users.update({
          where: { userId: parseInt(userId) },
          data: { userAddress: shippingAddress }
        })
      }

      console.log(`✅ Order created successfully for user ${userId}: Order #${result.orderId}`)

      return res.status(201).json({
        success: true,
        order: {
          orderId: result.orderId,
          orderAmount: result.orderAmount,
          orderDate: result.orderDate,
          items: result.orderDetails.map(detail => ({
            productId: detail.productId,
            productName: detail.product.productName,
            quantity: detail.quantity,
            unitPrice: detail.productPrice,
            lineTotal: detail.productPrice * detail.quantity
          })),
          shippingAddress,
          paymentMethod
        },
        message: 'Order created successfully'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User orders error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}