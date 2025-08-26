// src/pages/api/admin/orders.js
import prisma from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/adminAuth'

export default async function handler(req, res) {
  console.log(`📥 Admin orders request: ${req.method} ${req.url}`)
  
  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Check admin authentication
    if (!requireAdminAuth(req, res)) {
      return // requireAdminAuth already sent the error response
    }

    const { userId, orderId, status, limit = 50 } = req.query

    console.log('🔍 Fetching orders with filters:', { userId, orderId, status, limit })

    // Build where clause based on query parameters
    const where = {}
    if (userId) where.userId = parseInt(userId, 10)
    if (orderId) where.orderId = parseInt(orderId, 10)

    // Get orders with comprehensive includes
    const orders = await prisma.orders.findMany({
      where,
      include: {
        user: {
          select: {
            userId: true,
            userName: true,
            userEmail: true,
            userPhone: true,
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
                productImage: true
              }
            }
          },
          orderBy: {
            orderDetailId: 'asc'
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      },
      take: Math.min(parseInt(limit, 10), 100) // Max 100 orders per request
    })

    console.log(`📊 Found ${orders.length} orders`)

    // Transform data to include useful summary info
    const orderSummary = orders.map(order => {
      const totalItems = order.orderDetails.reduce((sum, detail) => sum + detail.quantity, 0)
      const lastPayment = order.payments.length > 0 ? order.payments[0] : null
      const paymentStatus = lastPayment?.paymentStatus || 'pending'
      
      // Calculate expected total from order details (for verification)
      const calculatedTotal = order.orderDetails.reduce((sum, detail) => {
        return sum + (detail.productPrice * detail.quantity)
      }, 0)

      return {
        orderId: order.orderId,
        userId: order.userId,
        orderAmount: order.orderAmount,
        calculatedTotal, // For debugging price discrepancies
        totalItems,
        orderDate: order.orderDate,
        paymentStatus,
        user: order.user,
        items: order.orderDetails.map(detail => ({
          orderDetailId: detail.orderDetailId,
          productId: detail.productId,
          productName: detail.product.productName,
          productImage: detail.product.productImage,
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
        // Summary flags for quick filtering
        isPaid: paymentStatus === 'paid' || paymentStatus === 'completed',
        isPending: paymentStatus === 'pending',
        isFailed: paymentStatus === 'failed' || paymentStatus === 'cancelled',
        hasDiscrepancy: Math.abs(order.orderAmount - calculatedTotal) > 0.01
      }
    })

    // Calculate summary statistics
    const summary = {
      totalOrders: orderSummary.length,
      totalValue: orderSummary.reduce((sum, order) => sum + order.orderAmount, 0),
      totalItems: orderSummary.reduce((sum, order) => sum + order.totalItems, 0),
      paidOrders: orderSummary.filter(o => o.isPaid).length,
      pendingOrders: orderSummary.filter(o => o.isPending).length,
      failedOrders: orderSummary.filter(o => o.isFailed).length,
      ordersWithDiscrepancies: orderSummary.filter(o => o.hasDiscrepancy).length
    }

    console.log('✅ Orders data processed successfully')
    console.log('📈 Summary:', summary)

    return res.status(200).json({
      success: true,
      summary,
      orders: orderSummary,
      filters: { userId, orderId, status, limit }
    })

  } catch (error) {
    console.error('💥 Admin orders error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}