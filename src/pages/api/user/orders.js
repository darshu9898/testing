// src/pages/api/user/orders.js - Ultra-optimized version
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  try {
    const contextStart = Date.now()
    const { userId, isAuthenticated } = await getContext(req, res)
    console.log(`⚡ Context: ${Date.now() - contextStart}ms`)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // GET: Fetch user orders (OPTIMIZED)
    if (req.method === 'GET') {
      console.log('📋 Orders API: GET started')
      const { orderId } = req.query

      let whereClause = { userId: parseInt(userId) }
      if (orderId) {
        whereClause.orderId = parseInt(orderId)
      }

      const dbStart = Date.now()

      // Single optimized query with selective fields
      const orders = await prisma.orders.findMany({
        where: whereClause,
        select: {
          orderId: true,
          orderAmount: true,
          orderDate: true,
          shippingAddress: true,
          orderDetails: {
            select: {
              orderDetailId: true,
              quantity: true,
              productPrice: true,
              product: {
                select: {
                  productId: true,
                  productName: true,
                  productImage: true
                }
              }
            }
          },
          payments: {
            select: {
              paymentMode: true,
              paymentStatus: true,
              paymentDate: true,
              razorpayPaymentId: true
            },
            orderBy: { paymentDate: 'desc' },
            take: 1
          }
        },
        orderBy: { orderDate: 'desc' },
        take: orderId ? 1 : 50 // Limit to 50 orders for performance
      })

      console.log(`💾 Orders query: ${Date.now() - dbStart}ms`)

      // Process orders efficiently in memory
      const formattedOrders = orders.map(order => {
        const latestPayment = order.payments[0]
        
        return {
          orderId: order.orderId,
          orderAmount: order.orderAmount,
          orderDate: order.orderDate,
          shippingAddress: order.shippingAddress,
          totalItems: order.orderDetails.length,
          paymentStatus: latestPayment?.paymentStatus || 'pending',
          paymentMode: latestPayment?.paymentMode || 'unknown',
          items: order.orderDetails.map(detail => ({
            productId: detail.product.productId,
            productName: detail.product.productName,
            productImage: detail.product.productImage,
            quantity: detail.quantity,
            productPrice: detail.productPrice,
            lineTotal: detail.productPrice * detail.quantity
          }))
        }
      })

      console.log(`✅ Orders GET total: ${Date.now() - startTime}ms`)
      
      // Cache for 1 minute
      res.setHeader('Cache-Control', 'private, max-age=60')
      
      return res.status(200).json({ orders: formattedOrders })
    }

    // POST: Create new order (OPTIMIZED)
    if (req.method === 'POST') {
      console.log('📋 Orders API: POST started')
      const { shippingAddress, paymentMethod = 'online' } = req.body

      if (!shippingAddress) {
        return res.status(400).json({ error: 'Shipping address is required' })
      }

      const dbStart = Date.now()

      // OPTIMIZED: Single transaction with efficient queries
      const result = await prisma.$transaction(async (tx) => {
        // Get cart items with minimal fields
        const cartItems = await tx.cart.findMany({
          where: { userId: parseInt(userId) },
          select: {
            cartId: true,
            productId: true,
            quantity: true,
            product: {
              select: {
                productId: true,
                productName: true,
                productPrice: true,
                productStock: true,
                productImage: true
              }
            }
          }
        })

        if (cartItems.length === 0) {
          throw { status: 400, message: 'Cart is empty' }
        }

        // Validate stock efficiently
        for (const item of cartItems) {
          if (item.quantity > item.product.productStock) {
            throw { 
              status: 400, 
              message: `Insufficient stock for ${item.product.productName}. Only ${item.product.productStock} available.` 
            }
          }
        }

        // Calculate total
        const orderAmount = cartItems.reduce((total, item) => 
          total + (item.product.productPrice * item.quantity), 0
        )

        // Create order with order details in one operation
        const order = await tx.orders.create({
          data: {
            userId: parseInt(userId),
            orderAmount,
            orderDate: new Date(),
            shippingAddress,
            orderDetails: {
              create: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                productPrice: item.product.productPrice
              }))
            }
          },
          select: {
            orderId: true,
            orderAmount: true,
            orderDate: true,
            shippingAddress: true
          }
        })

        // Handle COD orders
        if (paymentMethod === 'cod') {
          // Create COD payment record
          await tx.payments.create({
            data: {
              userId: parseInt(userId),
              orderId: order.orderId,
              razorpayOrderId: `cod_${order.orderId}_${Date.now()}`,
              paymentMode: 'cod',
              paymentStatus: 'pending_cod',
              paymentAmount: orderAmount,
              paymentDate: new Date()
            }
          })

          // Update stock for COD orders (bulk operations)
          const stockUpdates = cartItems.map(item => 
            tx.products.update({
              where: { productId: item.productId },
              data: { productStock: { decrement: item.quantity } }
            })
          )
          
          await Promise.all(stockUpdates)
          
          // Clear cart
          await tx.cart.deleteMany({
            where: { userId: parseInt(userId) }
          })
        }

        return {
          ...order,
          items: cartItems.map(item => ({
            productId: item.product.productId,
            productName: item.product.productName,
            productImage: item.product.productImage,
            quantity: item.quantity,
            productPrice: item.product.productPrice,
            lineTotal: item.product.productPrice * item.quantity
          })),
          paymentMethod
        }
      })

      console.log(`💾 Order creation: ${Date.now() - dbStart}ms`)
      console.log(`✅ Orders POST total: ${Date.now() - startTime}ms`)

      const successMessage = paymentMethod === 'cod' 
        ? 'COD order created and confirmed successfully!' 
        : 'Order created successfully. Proceed with payment.'

      return res.status(201).json({ 
        success: true, 
        order: {
          orderId: result.orderId,
          orderAmount: result.orderAmount,
          orderDate: result.orderDate,
          shippingAddress: result.shippingAddress,
          paymentMethod: result.paymentMethod,
          items: result.items,
          totalItems: result.items.length,
          status: paymentMethod === 'cod' ? 'confirmed_cod' : 'pending_payment'
        },
        message: successMessage
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 Orders API Error:', error)
    console.log(`❌ Orders API failed: ${Date.now() - startTime}ms`)
    
    if (error?.status) {
      return res.status(error.status).json({ error: error.message })
    }
    
    return res.status(500).json({ 
      error: 'Failed to process order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
