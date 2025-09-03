// src/pages/api/user/orders.js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User orders request: ${req.method} ${req.url}`)
  
  try {
    const { userId, user, isAuthenticated } = await getContext(req, res)
    console.log('👤 Auth context:', { isAuthenticated, userId, user })

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

      console.log('🔍 Fetching orders for user:', userId, { orderId, status, limit, offset, sortBy, sortOrder })

      // Build where clause
      const where = { userId: parseInt(userId) }
      if (orderId) where.orderId = parseInt(orderId, 10)

      // Build orderBy clause
      const validSortFields = ['orderDate', 'orderAmount', 'orderId']
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'orderDate'
      const orderBy = { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' }

      console.log('⚙️ Prisma query params:', { where, orderBy })

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

      console.log(`📊 Found ${orders.length} orders for user ${userId}`)

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
      console.log(`📦 Total orders count for user ${userId}:`, totalOrders)

      // Calculate summary statistics
      const summary = {
        totalOrders,
        totalValue: ordersWithSummary.reduce((sum, order) => sum + order.orderAmount, 0),
        confirmedOrders: ordersWithSummary.filter(o => o.orderStatus === 'confirmed').length,
        pendingOrders: ordersWithSummary.filter(o => o.orderStatus === 'pending').length,
        failedOrders: ordersWithSummary.filter(o => o.orderStatus === 'failed').length
      }

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
      console.log('🛒 Create order request body:', { shippingAddress, paymentMethod })

      if (!shippingAddress) {
        return res.status(400).json({ error: 'Shipping address is required' })
      }

      // Get user's cart items
      const cartItems = await prisma.cart.findMany({
        where: { userId: parseInt(userId) },
        include: { product: true }
      })
      console.log(`🛒 Found ${cartItems.length} cart items for user ${userId}`)

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' })
      }

      // Check stock availability
      for (const item of cartItems) {
        console.log(`📦 Checking stock for product ${item.productId}: requested ${item.quantity}, available ${item.product.productStock}`)
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
      console.log(`💰 Calculated order amount: ${orderAmount}`)

      // Create order with transaction
      const result = await prisma.$transaction(async (tx) => {
        console.log('🚀 Starting transaction to create order...')

        // Create order
        console.log('➡️ Creating order with details:', cartItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.product.productPrice
        })))

        const order = await tx.orders.create({
          data: {
            userId: parseInt(userId),
            orderAmount,
            orderDate: new Date(),
            orderDetails: {
              create: cartItems.map((item, idx) => {
                console.log(`📝 Creating orderDetail [${idx}] for product ${item.productId}`)
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  productPrice: item.product.productPrice
                }
              })
            }
          },
          include: {
            orderDetails: { include: { product: true } },
            user: { select: { userName: true, userEmail: true } }
          }
        })

        console.log('✅ Order inserted with ID:', order.orderId)

        // Update product stock
        for (const item of cartItems) {
          console.log(`🔄 Updating stock for product ${item.productId}, decrement by ${item.quantity}`)
          await tx.products.update({
            where: { productId: item.productId },
            data: { productStock: { decrement: item.quantity } }
          })
        }

        // Clear user's cart
        console.log(`🧹 Clearing cart for user ${userId}`)
        await tx.cart.deleteMany({
          where: { userId: parseInt(userId) }
        })

        return order
      })

      // Update user's shipping address if provided
      if (shippingAddress) {
        console.log(`📍 Updating shipping address for user ${userId}`)
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
    console.error('💥 User orders error (detailed):', {
      name: error.name,
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    })
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}
