// src/pages/api/user/orders/[id].js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User order [id] request: ${req.method} ${req.url}`)
  
  try {
    const { userId, isAuthenticated } = await getContext(req, res)
    const orderId = parseInt(req.query.id, 10)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ error: 'Valid order ID required' })
    }

    // Check if order exists and belongs to user
    const orderExists = await prisma.orders.findFirst({
      where: {
        orderId,
        userId: parseInt(userId)
      },
      select: { orderId: true }
    })

    if (!orderExists) {
      return res.status(404).json({ error: 'Order not found or not authorized' })
    }

    // ============== GET: Fetch Single Order Details ==============
    if (req.method === 'GET') {
      const order = await prisma.orders.findUnique({
        where: { orderId },
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
                  productDescription: true,
                  productPrice: true,
                  productImage: true,
                  productStock: true
                }
              }
            },
            orderBy: { orderDetailId: 'asc' }
          },
          payments: {
            orderBy: { paymentDate: 'desc' }
          }
        }
      })

      // Transform order data
      const totalItems = order.orderDetails.reduce((sum, detail) => sum + detail.quantity, 0)
      const lastPayment = order.payments.length > 0 ? order.payments[0] : null
      const paymentStatus = lastPayment?.paymentStatus || 'pending'

      // Determine order status
      let orderStatus = 'pending'
      if (paymentStatus === 'paid' || paymentStatus === 'completed') {
        orderStatus = 'confirmed'
      } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        orderStatus = 'failed'
      }

      // Calculate estimated delivery (example: 7 days from order date if confirmed)
      let estimatedDelivery = null
      if (orderStatus === 'confirmed') {
        const deliveryDate = new Date(order.orderDate)
        deliveryDate.setDate(deliveryDate.getDate() + 7)
        estimatedDelivery = deliveryDate
      }

      const orderDetails = {
        orderId: order.orderId,
        orderAmount: order.orderAmount,
        orderDate: order.orderDate,
        orderStatus,
        paymentStatus,
        totalItems,
        estimatedDelivery,
        customer: {
          name: order.user.userName,
          email: order.user.userEmail,
          phone: order.user.userPhone?.toString() || null,
          shippingAddress: order.user.userAddress
        },
        items: order.orderDetails.map(detail => ({
          orderDetailId: detail.orderDetailId,
          productId: detail.productId,
          productName: detail.product.productName,
          productDescription: detail.product.productDescription,
          productImage: detail.product.productImage,
          quantity: detail.quantity,
          unitPrice: detail.productPrice,
          lineTotal: detail.productPrice * detail.quantity,
          currentStock: detail.product.productStock, // Current stock for reordering
          canReorder: detail.product.productStock > 0
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
        // Order timeline for tracking
        timeline: [
          {
            status: 'placed',
            date: order.orderDate,
            completed: true,
            message: 'Order placed successfully'
          },
          {
            status: 'payment',
            date: lastPayment?.paymentDate || null,
            completed: paymentStatus === 'paid' || paymentStatus === 'completed',
            message: paymentStatus === 'paid' ? 'Payment completed' : 
                    paymentStatus === 'failed' ? 'Payment failed' : 'Awaiting payment'
          },
          {
            status: 'processing',
            date: orderStatus === 'confirmed' ? order.orderDate : null,
            completed: orderStatus === 'confirmed',
            message: orderStatus === 'confirmed' ? 'Order being processed' : 'Waiting for payment confirmation'
          },
          {
            status: 'shipped',
            date: null,
            completed: false,
            message: 'Order will be shipped soon'
          },
          {
            status: 'delivered',
            date: null,
            completed: false,
            message: 'Order will be delivered'
          }
        ]
      }

      console.log(`✅ Order details fetched: ${orderId} for user ${userId}`)

      return res.status(200).json({
        success: true,
        order: orderDetails
      })
    }

    // ============== PUT: Update Order (Limited Updates) ==============
    if (req.method === 'PUT') {
      const { action, shippingAddress } = req.body

      if (!action) {
        return res.status(400).json({ error: 'Action is required' })
      }

      // Check if order can be modified
      const orderWithPayments = await prisma.orders.findUnique({
        where: { orderId },
        include: { payments: true }
      })

      const hasSuccessfulPayment = orderWithPayments.payments.some(
        p => p.paymentStatus === 'paid' || p.paymentStatus === 'completed'
      )

      switch (action) {
        case 'cancel':
          if (hasSuccessfulPayment) {
            return res.status(400).json({ 
              error: 'Cannot cancel order with successful payment. Please contact support.' 
            })
          }

          // Cancel pending payments
          await prisma.payments.updateMany({
            where: { 
              orderId,
              paymentStatus: 'pending'
            },
            data: { paymentStatus: 'cancelled' }
          })

          return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            action: 'cancelled'
          })

        case 'update_address':
          if (hasSuccessfulPayment) {
            return res.status(400).json({ 
              error: 'Cannot update shipping address after payment. Please contact support.' 
            })
          }

          if (!shippingAddress || shippingAddress.trim().length < 10) {
            return res.status(400).json({ 
              error: 'Valid shipping address is required (minimum 10 characters)' 
            })
          }

          // Update user's address (since orders reference user address)
          await prisma.users.update({
            where: { userId: parseInt(userId) },
            data: { userAddress: shippingAddress.trim() }
          })

          return res.status(200).json({
            success: true,
            message: 'Shipping address updated successfully',
            action: 'address_updated',
            newAddress: shippingAddress.trim()
          })

        default:
          return res.status(400).json({ error: 'Invalid action' })
      }
    }

    // ============== DELETE: Cancel Order ==============
    if (req.method === 'DELETE') {
      // Check if order can be cancelled
      const orderWithPayments = await prisma.orders.findUnique({
        where: { orderId },
        include: { payments: true }
      })

      const hasSuccessfulPayment = orderWithPayments.payments.some(
        p => p.paymentStatus === 'paid' || p.paymentStatus === 'completed'
      )

      if (hasSuccessfulPayment) {
        return res.status(400).json({ 
          error: 'Cannot cancel order with successful payment. Please contact support for refund.' 
        })
      }

      // Cancel all pending payments
      await prisma.payments.updateMany({
        where: { 
          orderId,
          paymentStatus: 'pending'
        },
        data: { paymentStatus: 'cancelled' }
      })

      console.log(`✅ Order cancelled: ${orderId} for user ${userId}`)

      return res.status(200).json({
        success: true,
        message: 'Order cancelled successfully'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User order [id] error:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}